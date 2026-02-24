export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  'product/[slug]': { slug: string };
  'checkout/index': undefined;
  'checkout/success': { orderNumber: string };
  search: { q?: string };
  notifications: undefined;
  brands: undefined;
  'page/[slug]': { slug: string };
};

export type TabParamList = {
  index: undefined;
  'catalog/index': undefined;
  'catalog/[slug]': { slug: string };
  cart: undefined;
  wishlist: undefined;
  'account/index': undefined;
  'account/orders': undefined;
  'account/bonuses': undefined;
  'account/documents': undefined;
};
