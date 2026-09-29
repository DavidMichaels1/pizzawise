import { parseArgs } from 'node:util';
import * as api from './api.ts';
import { ApiError } from './api.ts';
import { CRUSTS, PRESET_AREAS, SAUCES, SIZES, TOPPINGS } from './catalog.ts';
import { loadConfig, requireToken, saveConfig, type PizzaRequest } from './config.ts';
import { formatDistance, formatEta, formatPrice } from './format.ts';

const [, , command, ...rest] = process.argv;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function checkEnum(name: string, value: string, allowed: string[]): void {
  if (!allowed.includes(value)) fail(`Invalid --${name} "${value}". Choose one of: ${allowed.join(', ')}`);
}

async function run() {
  switch (command) {
    case 'register': {
      const { values } = parseArgs({
        args: rest,
        options: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } },
      });
      if (!values.email || !values.password || !values.name) {
        fail('Usage: pizzawise register --email <email> --password <password> --name <name>');
      }
      const { token, user } = await api.register(values.email, values.password, values.name);
      saveConfig({ token });
      console.log(`Registered and logged in as ${user.name} <${user.email}>.`);
      break;
    }

    case 'login': {
      const { values } = parseArgs({
        args: rest,
        options: { email: { type: 'string' }, password: { type: 'string' } },
      });
      if (!values.email || !values.password) fail('Usage: pizzawise login --email <email> --password <password>');
      const { token, user } = await api.login(values.email, values.password);
      saveConfig({ token });
      console.log(`Logged in as ${user.name} <${user.email}>.`);
      break;
    }

    case 'compare': {
      const { values } = parseArgs({
        args: rest,
        options: {
          size: { type: 'string', default: 'MEDIUM' },
          crust: { type: 'string', default: 'THIN' },
          sauce: { type: 'string', default: 'TOMATO' },
          topping: { type: 'string', multiple: true, default: [] },
          area: { type: 'string' },
          lat: { type: 'string' },
          lng: { type: 'string' },
        },
      });

      checkEnum('size', values.size, SIZES);
      checkEnum('crust', values.crust, CRUSTS);
      checkEnum('sauce', values.sauce, SAUCES);
      for (const topping of values.topping) checkEnum('topping', topping, TOPPINGS);

      let location: { lat: number; lng: number };
      if (values.area) {
        const preset = PRESET_AREAS[values.area];
        if (!preset) fail(`Unknown --area "${values.area}". Choose one of: ${Object.keys(PRESET_AREAS).join(', ')}`);
        location = preset;
      } else if (values.lat && values.lng) {
        location = { lat: Number(values.lat), lng: Number(values.lng) };
      } else {
        fail(`Provide a delivery location: --area <name> (${Object.keys(PRESET_AREAS).join(', ')}) or --lat/--lng.`);
      }

      const request: PizzaRequest = { size: values.size, crust: values.crust, sauce: values.sauce, toppings: values.topping };
      const { results } = await api.comparePizzerias({ ...request, ...location });
      saveConfig({ lastCompare: { request, location, results } });

      if (results.length === 0) {
        console.log('No pizzerias came back for that location — try again or pick a different area.');
        break;
      }

      console.log(`${results.length} pizzerias nearby, ranked by value:\n`);
      results.forEach((r, i) => {
        const flag = r.matchQuality === 'exact' ? 'exact' : 'approximate';
        console.log(`${i + 1}. [${r.pizzeriaId}] ${r.pizzeriaName} — ${formatPrice(r.priceAgorot)} (${flag})`);
        console.log(`   ${formatDistance(r.distanceKm)} · ${formatEta(r.etaMinutes)}`);
        if (r.matchQuality === 'approximate' && r.missingToppings.length > 0) {
          console.log(`   missing: ${r.missingToppings.join(', ').toLowerCase()}`);
        }
      });
      console.log('\nRun `pizzawise order --pick <number>` to order one of these.');
      break;
    }

    case 'order': {
      const { values } = parseArgs({
        args: rest,
        options: { pick: { type: 'string' }, pizzeria: { type: 'string' } },
      });
      const token = requireToken();
      const { lastCompare } = loadConfig();
      if (!lastCompare) fail('Run `pizzawise compare` first, then order from those results.');

      const pizzeriaId = values.pizzeria ?? (values.pick ? lastCompare.results[Number(values.pick) - 1]?.pizzeriaId : undefined);
      if (!pizzeriaId) fail('Usage: pizzawise order --pick <number> (from the last `compare`), or --pizzeria <id>');

      const order = await api.createOrder(token, {
        ...lastCompare.request,
        pizzeriaId,
        deliveryLat: lastCompare.location.lat,
        deliveryLng: lastCompare.location.lng,
      } as PizzaRequest & { pizzeriaId: string; deliveryLat: number; deliveryLng: number });

      console.log(`Order placed: ${order.id}`);
      console.log(`${order.pizzeriaName} — ${formatPrice(order.priceAgorot)} — status: ${order.status}`);
      break;
    }

    case 'orders': {
      const token = requireToken();
      const orders = await api.listOrders(token);
      if (orders.length === 0) {
        console.log('No orders yet.');
        break;
      }
      for (const o of orders) {
        console.log(`${o.id}  ${o.pizzeriaName.padEnd(24)} ${formatPrice(o.priceAgorot).padEnd(10)} ${o.status}`);
      }
      break;
    }

    case 'status': {
      const [orderId] = rest;
      if (!orderId) fail('Usage: pizzawise status <order-id>');
      const token = requireToken();
      const order = await api.getOrder(token, orderId);
      console.log(`${order.pizzeriaName} — ${order.size} ${order.crust.toLowerCase()} crust, ${order.sauce.toLowerCase()} sauce`);
      if (order.toppings.length > 0) console.log(`Toppings: ${order.toppings.join(', ').toLowerCase()}`);
      console.log(`Price: ${formatPrice(order.priceAgorot)}`);
      console.log(`Status: ${order.status}`);
      break;
    }

    case 'cancel': {
      const [orderId] = rest;
      if (!orderId) fail('Usage: pizzawise cancel <order-id>');
      const token = requireToken();
      const order = await api.cancelOrder(token, orderId);
      console.log(`Order ${order.id} is now ${order.status}.`);
      break;
    }

    default:
      console.log(
        [
          'PizzaWise CLI',
          '',
          'Usage:',
          '  pizzawise register --email <e> --password <p> --name <n>',
          '  pizzawise login --email <e> --password <p>',
          '  pizzawise compare [--size SMALL|MEDIUM|LARGE] [--crust ...] [--sauce ...] [--topping ...]* (--area <name> | --lat <n> --lng <n>)',
          '  pizzawise order --pick <number>   (or --pizzeria <id>)',
          '  pizzawise orders',
          '  pizzawise status <order-id>',
          '  pizzawise cancel <order-id>',
          '',
          `Areas: ${Object.keys(PRESET_AREAS).join(', ')}`,
          `API base URL: ${process.env.PIZZAWISE_API_BASE_URL ?? '(default) https://api-production-43395.up.railway.app'}`,
        ].join('\n'),
      );
  }
}

run().catch((err) => {
  if (err instanceof ApiError) fail(`Error: ${err.message}`);
  throw err;
});
