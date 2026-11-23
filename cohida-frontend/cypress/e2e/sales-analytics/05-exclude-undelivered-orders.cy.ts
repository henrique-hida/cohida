import {
  expectChartValue,
  prepare,
  selectCategories,
  visitAnalytics,
} from './helpers';

it('5) inclui a compra em transporte no histórico', () => {
  prepare();
  visitAnalytics();
  selectCategories('Análise teste B');
  expectChartValue('mar', 'Análise teste B', '200,00');
});
