import { definePlugin } from 'sanity';
import { ExpiredOffersTool } from './ExpiredOffersTool';

export const expiredOffersManager = definePlugin({
  name: 'expired-offers-manager',
  studio: {
    components: {
      tool: ExpiredOffersTool,
    },
  },
  tools: [
    {
      name: 'expired-offers',
      title: 'Expired Offers Manager',
      component: ExpiredOffersTool,
      icon: () => '��',
    },
  ],
});
