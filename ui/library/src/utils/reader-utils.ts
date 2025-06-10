export const RENDER_TYPE = {
  SINGLE_CANVAS: 'single-canvas',
  MULTI_CANVAS: 'multi-canvas',
} as const;

export type RenderType = typeof RENDER_TYPE[keyof typeof RENDER_TYPE];

export type RenderMode = 'canvas' | 'none';

export function getRenderMode(renderType: RenderType): RenderMode {
  switch (renderType) {
    case RENDER_TYPE.SINGLE_CANVAS:
      return 'canvas';
    case RENDER_TYPE.MULTI_CANVAS:
      return 'canvas';
    default:
      return 'canvas';
  }
}

export function getClassNameSuffixFromRenderType(renderType: RenderType): string {
  return renderType;
}
