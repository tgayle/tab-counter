import { ExpressionGroupingStrategy } from './ExpressionGroupingStrategy';
import { OriginGroupingStrategy } from './OriginGroupingStrategy';
import { TabGroupGroupingStrategy } from './TabGroupGroupingStrategy';
import { WindowGroupingStrategy } from './WindowGroupingStrategy';

export const TabGroupingStrategies = {
  Expression: new ExpressionGroupingStrategy(),
  Origin: new OriginGroupingStrategy(),
  TabGroup: new TabGroupGroupingStrategy(),
  Window: new WindowGroupingStrategy(),
};
