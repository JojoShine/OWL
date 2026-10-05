export type SceneTheme = 'general' | 'government-service';

export function isSceneTheme(value: unknown): value is SceneTheme {
  return value === 'general' || value === 'government-service';
}

export function resolveSceneTheme(personal: string | null, project: string | null): SceneTheme {
  return isSceneTheme(personal) ? personal : isSceneTheme(project) ? project : 'general';
}
