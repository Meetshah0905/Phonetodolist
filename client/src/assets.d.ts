declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.MP3" {
  const src: string;
  export default src;
}

declare module "@assets/*.mp3" {
  const src: string;
  export default src;
}

declare module "@assets/*.MP3" {
  const src: string;
  export default src;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}

