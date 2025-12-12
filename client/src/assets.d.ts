declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}

