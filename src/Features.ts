export const inDev =
  process.env.NODE_ENV === 'development' ||
  process.env.BUILD_COMMIT?.includes('dirty');

export default class Features {
  static TAB_GROUPING = inDev && false;
  static TAB_ARCHIVING = inDev && false;
}
