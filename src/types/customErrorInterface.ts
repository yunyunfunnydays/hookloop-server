import ApiStatus from "./apiStatus";
import StatusCode from "./statusCode";

export interface IDataType {
  [key: string]: any;
}

export interface ICustomErrorInterface extends Error {
  statusCode: StatusCode;
  status: ApiStatus;
  data?: IDataType;
  isOperational?: boolean;
}