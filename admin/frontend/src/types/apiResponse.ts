export interface IFetchApiResult {
  success: boolean;
  message: string;
  httpCode?: number;
}

export interface IFetchApiRFesultContent<TResult = unknown> extends IFetchApiResult {
  result: TResult;
}
