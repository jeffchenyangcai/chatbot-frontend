// types.ts
export interface Route {
  path: string;
  component: string;
  routes?: Route[];
}
