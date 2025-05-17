/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "react-router-dom" {
  export class BrowserRouter extends React.Component<any, any> {
    refs: any;
  }
  export class Route extends React.Component<any, any> {
    refs: any;
  }
} 