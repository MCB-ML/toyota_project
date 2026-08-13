import base64
import logging
from typing import List

import httpx
from azure.identity.aio import ClientSecretCredential

from internal.config.config import AzureADConfig
from internal.domain.entities.ad_user import ADUser


class MicrosoftGraphService:
    def __init__(self, config: AzureADConfig):
        self.config = config
        self.logger = logging.getLogger("MicrosoftGraphService")

        # 자격증명은 처음 쓸 때 만든다.
        # 여기서 바로 만들면 AZURE_AD_* 가 비어 있을 때 ValueError 가 나고,
        # AD 를 안 쓰는 환경에서도 어드민 API 전체가 뜨지 못한다.
        self._credential = None

        # Reuse a single client
        self.client = httpx.AsyncClient(timeout=30.0)

    @property
    def credential(self) -> ClientSecretCredential:
        if self._credential is None:
            if not (self.config.tenantId and self.config.clientId and self.config.clientSecret):
                raise RuntimeError(
                    "Azure AD 가 설정되지 않았습니다. "
                    "AZURE_AD_TENANT_ID / AZURE_AD_CLIENT_ID / AZURE_AD_CLIENT_SECRET 을 채우세요."
                )

            self._credential = ClientSecretCredential(
                tenant_id=self.config.tenantId,
                client_id=self.config.clientId,
                client_secret=self.config.clientSecret,
            )

        return self._credential

    @property
    def isConfigured(self) -> bool:
        return bool(
            self.config.tenantId and self.config.clientId and self.config.clientSecret
        )

    async def close(self):
        """Close the underlying HTTP client"""
        await self.client.aclose()

    # end def

    async def getUserProfile(self, accessToken: str) -> dict:
        headers = {
            "Authorization": f"Bearer {accessToken}",
            "Content-Type": "application/json",
        }

        result = await self.client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers=headers,
        )

        if result.status_code != 200:
            self.logger.error(
                f"Failed to fetch user profile: {result.status_code} - {result.text}"
            )
            raise Exception(f"Failed to validate token: {result.text}")

        return result.json()

    async def exchangeOboToken(self, userToken: str) -> str:
        url = f"https://login.microsoftonline.com/{self.config.tenantId}/oauth2/v2.0/token"

        data = {
            "client_id": self.config.clientId,
            "client_secret": self.config.clientSecret,
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": userToken,
            "requested_token_use": "on_behalf_of",
            "scope": "User.Read",
        }

        result = await self.client.post(url, data=data)

        if result.status_code != 200:
            self.logger.error(
                f"Failed to exchange OBO token: {result.status_code} - {result.text}"
            )
            raise Exception(f"Failed to exchange OBO token: {result.text}")

        response_data = result.json()
        return response_data.get("access_token")

    async def getUsers(self) -> List[ADUser]:
        try:
            # Get access token
            token = await self.credential.get_token(
                "https://graph.microsoft.com/.default"
            )
            headers = {
                "Authorization": f"Bearer {token.token}",
                "Content-Type": "application/json",
            }

            url = "https://graph.microsoft.com/v1.0/users"
            adUsers = []

            # Select specific fields
            queryParams = {
                "$select": "id,displayName,mail,userPrincipalName,jobTitle,department"
            }

            while url:
                result = await self.client.get(
                    url,
                    headers=headers,
                    params=queryParams
                    if url == "https://graph.microsoft.com/v1.0/users"
                    else None,
                )

                if result.status_code != 200:
                    self.logger.error(
                        f"Failed to fetch users from Graph API: {result.status_code} - {result.text}"
                    )
                    if not adUsers:
                        return []
                    break

                data = result.json()

                # Graph API returns value array
                usersData = data.get("value", [])

                for userData in usersData:
                    userEmail = userData.get("mail") or userData.get(
                        "userPrincipalName"
                    )

                    adUser = ADUser(
                        userId=userData.get("id"),
                        userName=userData.get("displayName"),
                        userEmail=userEmail,
                        userRole=userData.get("jobTitle"),
                        userDepartment=userData.get("department"),
                    )

                    # Fetch photo
                    try:
                        photoRes = await self.client.get(
                            f"https://graph.microsoft.com/v1.0/users/{userData.get('id')}/photo/$value",
                            headers=headers,
                        )
                        if photoRes.status_code == 200:
                            adUser.userAvatar = base64.b64encode(
                                photoRes.content
                            ).decode("utf-8")
                    except Exception as e:
                        # Log but don't fail the user sync
                        self.logger.warning(
                            f"Failed to fetch photo for {userEmail}: {e}"
                        )

                    adUsers.append(adUser)

                # Check for next page
                url = data.get("@odata.nextLink")

            return adUsers

        except Exception as e:
            self.logger.error(f"Error fetching users from Graph API: {str(e)}")
            raise e
        # end try

    # end def

    async def getUserDetails(self, userEmail: str) -> dict:
        import asyncio

        try:
            # Get access token
            token = await self.credential.get_token(
                "https://graph.microsoft.com/.default"
            )
            headers = {
                "Authorization": f"Bearer {token.token}",
                "Content-Type": "application/json",
            }

            userUrl = f"https://graph.microsoft.com/v1.0/users/{userEmail}"
            select_fields = (
                "id,displayName,mail,userPrincipalName,jobTitle,department,businessPhones,"
                "mobilePhone,officeLocation,preferredLanguage,surname,givenName,employeeId,"
                "employeeType,streetAddress,city,state,postalCode,country,companyName,accountEnabled,"
                "createdDateTime,usageLocation,userType"
            )
            userRes = await self.client.get(
                userUrl,
                headers=headers,
                params={"$select": select_fields},
            )

            if userRes.status_code == 404:
                raise Exception(f"User with email '{userEmail}' not found in Azure AD")
            elif userRes.status_code != 200:
                self.logger.error(
                    f"Failed to fetch user {userEmail}: {userRes.status_code} - {userRes.text}"
                )
                raise Exception(f"Failed to fetch user details: {userRes.text}")
            # end if

            userData = userRes.json()
            userId = userData.get("id")

            async def fetchMailFolders():
                res = await self.client.get(
                    f"https://graph.microsoft.com/v1.0/users/{userId}/mailFolders",
                    headers=headers,
                    params={"$top": 100},  # Fetch top folders
                )
                if res.status_code == 200:
                    data = res.json()
                    totalUnread = sum(
                        folder.get("unreadItemCount", 0)
                        for folder in data.get("value", [])
                    )
                    return totalUnread
                return 0

            async def fetchChats():
                res = await self.client.get(
                    f"https://graph.microsoft.com/v1.0/users/{userId}/chats",
                    headers=headers,
                    params={
                        "$top": 50,
                        "$orderby": "lastModifiedDateTime desc",
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return len(data.get("value", []))
                return 0

            # end def

            async def fetchPhoto():
                try:
                    res = await self.client.get(
                        f"https://graph.microsoft.com/v1.0/users/{userId}/photo/$value",
                        headers=headers,
                    )
                    if res.status_code == 200:
                        return base64.b64encode(res.content).decode("utf-8")
                except Exception:
                    pass
                return None

            # end def

            unreadMailCount, activeChatCount, photo = await asyncio.gather(
                fetchMailFolders(), fetchChats(), fetchPhoto()
            )

            response = {
                **userData,  # Include all profile fields fetched
                "unreadMailCount": unreadMailCount,
                "activeChatCount": activeChatCount,
            }
            if photo:
                response["avatar"] = photo

            self.logger.info(f"User details: {response}")

            return response

        except Exception as e:
            self.logger.error(f"Error fetching user details: {str(e)}")
            raise e
        # end try

    # end def


# end class
