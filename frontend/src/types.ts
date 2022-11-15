export enum Sender {
    React,
    Content,
    FlaskAdd,
    FlaskSearch,
    GetUserAuth,
    GetVisitedSite
}

export interface ChromeMessage {
    from: Sender,
    message: any
}

export interface RemovedResult {
    allHistory: boolean;
    urls?: string[] | undefined;
  }

export type MessageResponse = (response?: any) => void
