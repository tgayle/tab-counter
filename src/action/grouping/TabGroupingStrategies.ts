import { ExpressionGroupingStrategy } from './ExpressionGroupingStrategy';
import { OriginGroupingStrategy } from './OriginGroupingStrategy';
import { WindowGroupingStrategy } from './WindowGroupingStrategy';

export const TabGroupingStrategies = {
  Origin: new OriginGroupingStrategy(),
  Window: new WindowGroupingStrategy(),
  Expression: new ExpressionGroupingStrategy(),
};
