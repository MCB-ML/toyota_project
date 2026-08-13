import { createFileRoute } from "@tanstack/react-router";
import UsersMainComponent from "@/components/layout/Users/organism/UsersMainComponent";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersMainComponent,
});
