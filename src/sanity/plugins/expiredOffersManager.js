import { definePlugin } from 'sanity';
import { ExpiredOffersTool } from './ExpiredOffersTool';

export const expiredOffersManager = definePlugin({
  name: 'redirection-tool',
  studio: {
    components: {
      tool: ExpiredOffersTool,
    },
  },
  tools: [
    {
      name: 'redirection',
      title: 'Redirection Tool',
      component: ExpiredOffersTool,
      icon: () => '��',
    },
  ],
});
