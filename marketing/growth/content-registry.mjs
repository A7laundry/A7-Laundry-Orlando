export const CONTENT_REGISTRY_SCHEMA_VERSION = '2.0.0';

// Authorial identity lock. IDs are deliberately stored independently from the
// route so a future URL move keeps the same analytics and release identity.
// Adding a route requires an explicit lock entry; no derived fallback exists.
const ASSET_IDS = Object.freeze({
  '/': 'asset_home', '/about': 'asset_about', '/privacy-policy': 'asset_privacy_policy',
  '/service-areas': 'asset_service_areas', '/blog': 'asset_blog',
  '/laundry-pickup-delivery-orlando': 'asset_laundry_pickup_delivery_orlando', '/plans': 'asset_plans',
  '/carpet': 'asset_carpet', '/shoes': 'asset_shoes', '/upholstery': 'asset_upholstery',
  '/mattress': 'asset_mattress', '/area-rug': 'asset_area_rug', '/curtain': 'asset_curtain',
  '/blog/linen-towel-service-orlando': 'asset_blog_linen_towel_service_orlando',
  '/comforter': 'asset_comforter', '/vacation': 'asset_vacation',
  '/blog/hotel-laundry-service-orlando': 'asset_blog_hotel_laundry_service_orlando',
  '/blog/airbnb-laundry-service-orlando': 'asset_blog_airbnb_laundry_service_orlando',
  '/blog/hotel-vs-pickup-laundry-orlando': 'asset_blog_hotel_vs_pickup_laundry_orlando',
  '/blog/no-car-laundry-orlando': 'asset_blog_no_car_laundry_orlando',
  '/blog/book-laundry-whatsapp-orlando': 'asset_blog_book_laundry_whatsapp_orlando',
  '/blog/orlando-hotel-no-washer-laundry': 'asset_blog_orlando_hotel_no_washer_laundry',
  '/blog/family-vacation-laundry-orlando': 'asset_blog_family_vacation_laundry_orlando',
  '/blog/pack-less-orlando-trip-laundry': 'asset_blog_pack_less_orlando_trip_laundry',
  '/blog/laundry-tips-orlando-vacation': 'asset_blog_laundry_tips_orlando_vacation',
  '/blog/laundry-before-checkout-orlando': 'asset_blog_laundry_before_checkout_orlando',
  '/blog/same-day-laundry-tourists-orlando': 'asset_blog_same_day_laundry_tourists_orlando',
  '/blog/same-day-laundry-orlando': 'asset_blog_same_day_laundry_orlando',
  '/blog/express-laundry-orlando': 'asset_blog_express_laundry_orlando',
  '/blog/same-day-drop-off-laundry-orlando': 'asset_blog_same_day_drop_off_laundry_orlando',
  '/blog/laundry-service-orlando': 'asset_blog_laundry_service_orlando',
  '/blog/orlando-laundromat-vs-delivery': 'asset_blog_orlando_laundromat_vs_delivery',
  '/blog/laundry-cost-orlando': 'asset_blog_laundry_cost_orlando', '/blog/a7-laundry-review': 'asset_blog_a7_laundry_review',
  '/blog/laundry-international-drive-orlando': 'asset_blog_laundry_international_drive_orlando',
  '/blog/laundry-near-universal-orlando': 'asset_blog_laundry_near_universal_orlando',
  '/blog/laundry-winter-garden-fl': 'asset_blog_laundry_winter_garden_fl',
  '/blog/laundry-windermere-fl': 'asset_blog_laundry_windermere_fl',
  '/blog/laundry-clermont-fl': 'asset_blog_laundry_clermont_fl', '/blog/laundry-ocoee-fl': 'asset_blog_laundry_ocoee_fl',
  '/blog/laundry-kissimmee': 'asset_blog_laundry_kissimmee',
  '/blog/laundry-near-disney-world': 'asset_blog_laundry_near_disney_world',
  '/blog/laundry-disney-springs-area': 'asset_blog_laundry_disney_springs_area',
  '/blog/laundry-champions-gate': 'asset_blog_laundry_champions_gate',
  '/blog/laundry-orlando-airport': 'asset_blog_laundry_orlando_airport',
  '/blog/laundry-near-seaworld-orlando': 'asset_blog_laundry_near_seaworld_orlando',
  '/blog/laundry-lake-buena-vista': 'asset_blog_laundry_lake_buena_vista',
  '/blog/laundry-convention-center-orlando': 'asset_blog_laundry_convention_center_orlando',
  '/blog/laundry-port-canaveral-cruise': 'asset_blog_laundry_port_canaveral_cruise',
  '/blog/snowbird-laundry-orlando': 'asset_blog_snowbird_laundry_orlando',
  '/blog/laundry-for-vacation-rental-guests': 'asset_blog_laundry_for_vacation_rental_guests',
  '/blog/vacation-rental-laundry-orlando': 'asset_blog_vacation_rental_laundry_orlando',
  '/blog/laundry-subscription-vacation-rental': 'asset_blog_laundry_subscription_vacation_rental',
  '/blog/reunion-resort-laundry-service': 'asset_blog_reunion_resort_laundry_service',
  '/blog/orlando-vacation-rental-laundry-guide': 'asset_blog_orlando_vacation_rental_laundry_guide',
  '/blog/vacation-rental-checklist-orlando': 'asset_blog_vacation_rental_checklist_orlando',
  '/blog/airbnb-host-laundry-tips-orlando': 'asset_blog_airbnb_host_laundry_tips_orlando',
  '/blog/how-often-wash-vacation-rental-linens': 'asset_blog_how_often_wash_vacation_rental_linens',
  '/blog/how-to-clean-comforter': 'asset_blog_how_to_clean_comforter',
  '/blog/comforter-cleaning-service-orlando': 'asset_blog_comforter_cleaning_service_orlando',
  '/blog/comforter-cleaning-service-orlando-v2': 'asset_blog_comforter_cleaning_service_orlando_v2',
  '/blog/lavanderia-a-domicilio-orlando': 'asset_blog_lavanderia_a_domicilio_orlando',
  '/blog/laundry-davenport': 'asset_blog_laundry_davenport',
  '/blog/laundry-solara-resort': 'asset_blog_laundry_solara_resort',
  '/blog/laundry-encore-resort-reunion': 'asset_blog_laundry_encore_resort_reunion',
  '/blog/laundry-storey-lake-resort': 'asset_blog_laundry_storey_lake_resort',
  '/blog/laundry-windsor-hills-resort': 'asset_blog_laundry_windsor_hills_resort',
  '/blog/laundry-windsor-island-resort': 'asset_blog_laundry_windsor_island_resort',
  '/blog/laundry-solterra-resort': 'asset_blog_laundry_solterra_resort',
  '/blog/laundry-emerald-island-resort': 'asset_blog_laundry_emerald_island_resort',
  '/blog/laundry-paradise-palms-resort': 'asset_blog_laundry_paradise_palms_resort',
  '/blog/laundry-terra-verde-resort': 'asset_blog_laundry_terra_verde_resort',
  '/blog/laundry-bella-vida-resort': 'asset_blog_laundry_bella_vida_resort',
  '/blog/laundry-vista-cay-resort': 'asset_blog_laundry_vista_cay_resort',
  '/blog/laundry-margaritaville-resort-orlando': 'asset_blog_laundry_margaritaville_resort_orlando',
  '/blog/laundry-sonoma-resort-tapestry': 'asset_blog_laundry_sonoma_resort_tapestry',
  '/blog/laundry-veranda-palms-resort': 'asset_blog_laundry_veranda_palms_resort',
  '/blog/laundry-regal-oaks-resort': 'asset_blog_laundry_regal_oaks_resort',
  '/blog/laundry-oakwater-resort': 'asset_blog_laundry_oakwater_resort',
  '/blog/laundry-runaway-beach-club': 'asset_blog_laundry_runaway_beach_club',
  '/blog/laundry-magic-village-resort': 'asset_blog_laundry_magic_village_resort',
  '/blog/laundry-compass-bay-resort': 'asset_blog_laundry_compass_bay_resort',
  '/blog/laundry-villas-seven-dwarfs': 'asset_blog_laundry_villas_seven_dwarfs',
  '/blog/laundry-festival-resort-davenport': 'asset_blog_laundry_festival_resort_davenport',
  '/blog/laundry-aviana-resort': 'asset_blog_laundry_aviana_resort',
  '/blog/laundry-providence-resort': 'asset_blog_laundry_providence_resort',
  '/blog/laundry-highlands-reserve': 'asset_blog_laundry_highlands_reserve',
  '/blog/laundry-tuscan-hills-davenport': 'asset_blog_laundry_tuscan_hills_davenport',
  '/blog/laundry-watersong-resort': 'asset_blog_laundry_watersong_resort',
  '/blog/laundry-west-haven-davenport': 'asset_blog_laundry_west_haven_davenport',
  '/blog/laundry-oasis-club-championsgate': 'asset_blog_laundry_oasis_club_championsgate',
  '/blog/laundry-retreat-championsgate': 'asset_blog_laundry_retreat_championsgate',
  '/blog/laundry-balmoral-resort': 'asset_blog_laundry_balmoral_resort',
  '/blog/laundry-college-park': 'asset_blog_laundry_college_park',
  '/blog/laundry-southchase': 'asset_blog_laundry_southchase',
  '/blog/laundry-celebration': 'asset_blog_laundry_celebration',
  '/blog/laundry-sand-lake-restaurant-row': 'asset_blog_laundry_sand_lake_restaurant_row',
  '/blog/laundry-thornton-park': 'asset_blog_laundry_thornton_park'
});

function stableAssetId(route) {
  const assetId = ASSET_IDS[route];
  if (!assetId) throw new Error(`${route}: missing authored asset identity lock`);
  return assetId;
}

export function authoredAssetId(route) {
  return stableAssetId(route);
}

export const CONTENT_CLUSTERS = [
  { id: 'brand-foundation', topic: 'A7 Laundry brand and trust', ownerPath: '/', parentClusterId: null },
  { id: 'site-navigation', topic: 'Service and editorial navigation', ownerPath: '/blog', parentClusterId: 'brand-foundation' },
  { id: 'guest-laundry-orlando', topic: 'Orlando guest laundry pickup and delivery', ownerPath: '/laundry-pickup-delivery-orlando', parentClusterId: 'brand-foundation' },
  { id: 'guest-laundry-guides', topic: 'Guest laundry decision guides', ownerPath: '/blog/hotel-laundry-service-orlando', parentClusterId: 'guest-laundry-orlando' },
  { id: 'deadline-and-same-day', topic: 'Needed-by and same-day laundry intent', ownerPath: '/blog/laundry-before-checkout-orlando', parentClusterId: 'guest-laundry-orlando' },
  { id: 'orlando-options-and-cost', topic: 'Laundry options and pricing comparisons', ownerPath: '/plans', parentClusterId: 'guest-laundry-orlando' },
  { id: 'orlando-geo', topic: 'Orlando regional guest laundry authority', ownerPath: '/blog/laundry-lake-buena-vista', parentClusterId: 'guest-laundry-orlando' },
  { id: 'service-verticals', topic: 'A7 Laundry service verticals', ownerPath: '/service-areas', parentClusterId: 'brand-foundation' },
  { id: 'vacation-rental-guests', topic: 'Vacation-rental guest laundry', ownerPath: '/blog/laundry-for-vacation-rental-guests', parentClusterId: 'guest-laundry-orlando' },
  { id: 'vacation-rental-hosts', topic: 'Vacation-rental host laundry operations', ownerPath: '/vacation', parentClusterId: 'service-verticals' },
  { id: 'comforter-care', topic: 'Comforter care and cleaning', ownerPath: '/comforter', parentClusterId: 'service-verticals' },
  { id: 'spanish-orlando-guest', topic: 'Spanish-language Orlando guest laundry', ownerPath: '/blog/lavanderia-a-domicilio-orlando', parentClusterId: 'guest-laundry-orlando' },
  { id: 'resort-property-review', topic: 'Legacy resort-property pages under editorial review', ownerPath: '/blog/laundry-solara-resort', parentClusterId: 'orlando-geo' }
];

export const SYSTEM_ROUTE_EXCLUSIONS = [
  { route: '/comforter-thanks', sourceFile: 'comforter-thanks.html', exclusionClass: 'conversion_confirmation', reason: 'Post-submit confirmation is not an acquisition asset.' },
  { route: '/guest-payment-confirmation', sourceFile: 'guest-payment-confirmation.html', exclusionClass: 'payment_confirmation', reason: 'Stripe-verified payment confirmation is transactional.' },
  { route: '/payment-link', sourceFile: 'payment-link.html', exclusionClass: 'operator_tool', reason: 'Authenticated operator payment-link tool is not a marketing funnel.' }
];

const foundation = {
  contentType: 'foundation',
  funnelStage: 'non_funnel',
  clusterId: 'brand-foundation',
  pillarPath: '/',
  indexationPolicy: 'index',
  mosVisibility: 'portfolio'
};

const hub = {
  contentType: 'hub',
  funnelStage: 'mofu',
  clusterId: 'site-navigation',
  pillarPath: '/',
  indexationPolicy: 'index',
  mosVisibility: 'portfolio'
};

const service = {
  contentType: 'service-page',
  funnelStage: 'bofu',
  clusterId: 'service-verticals',
  pillarPath: '/service-areas',
  indexationPolicy: 'index',
  mosVisibility: 'portfolio'
};

const geo = {
  contentType: 'geo-page',
  funnelStage: 'bofu',
  clusterId: 'orlando-geo',
  pillarPath: '/service-areas',
  indexationPolicy: 'index',
  mosVisibility: 'portfolio'
};

const article = {
  contentType: 'article',
  funnelStage: 'mofu',
  clusterId: 'guest-laundry-guides',
  pillarPath: '/laundry-pickup-delivery-orlando',
  indexationPolicy: 'index',
  mosVisibility: 'portfolio'
};

const managedFunnels = new Map([
  ['/laundry-pickup-delivery-orlando', {
    funnelId: 'orlando-money',
    funnelName: 'Orlando Guest Pickup',
    funnelCodes: ['SEO-ORLANDO-MONEY-V2'],
    intent: 'Busca comercial ampla por guest laundry pickup em Orlando',
    audience: 'Hóspedes de hotel, resort e vacation rental',
    action: 'Enviar estadia, needed-by, carga e Standard/Express por WhatsApp ou SMS',
    campaignRole: 'Destino principal da campanha Guest Laundry Search'
  }],
  ['/blog/laundry-lake-buena-vista', {
    funnelId: 'lake-buena-vista',
    funnelName: 'Lake Buena Vista Hotel Pickup',
    funnelCodes: ['SEO-LBV-V2', 'SEO-LBV-PROOF', 'SEO-LBV-HOTELS', 'SEO-LBV-FLOAT', 'SEO-LBV-SMS'],
    intent: 'Hotel laundry pickup em Lake Buena Vista',
    audience: 'Hóspedes do corredor de hotéis e resorts de Lake Buena Vista',
    action: 'Confirmar hotel, handoff e janela de retorno',
    campaignRole: 'Funil geo com sinal comercial confirmado pelo proprietário'
  }],
  ['/blog/laundry-near-universal-orlando', {
    funnelId: 'orlando-resort',
    funnelName: 'Orlando Resort Next-Day Plans',
    funnelCodes: ['SEO-ORLANDO-RESORT-V1'],
    intent: 'Lavanderia entre dias completos de resort e planos de amanhã',
    audience: 'Hóspedes de resort com needed-by para o próximo dia',
    action: 'Confirmar estadia, prazo e ritmo do serviço',
    campaignRole: 'Funil orgânico de intenção resort, separado de checkout urgente'
  }],
  ['/blog/laundry-international-drive-orlando', {
    funnelId: 'international-drive',
    funnelName: 'International Drive Guest Pickup',
    funnelCodes: ['SEO-IDRIVE-V1'],
    intent: 'Hotel, resort e convenção no corredor de International Drive',
    audience: 'Hóspedes e visitantes de convenções na região',
    action: 'Confirmar propriedade, handoff, prazo e serviço',
    campaignRole: 'Funil local do corredor International Drive',
    sourceLifecycle: 'reviewed_candidate'
  }],
  ['/plans', {
    funnelId: 'plans',
    funnelName: 'Pricing and Service Choice',
    funnelCodes: ['SEO-ORLANDO-PLANS-V1'],
    intent: 'Preço, mínimo, estimativa e escolha Standard/Express',
    audience: 'Visitantes comparando custo e prazo antes do contato',
    action: 'Estimar carga e iniciar pedido com contexto preservado',
    campaignRole: 'BOFU de preço e escolha de serviço'
  }],
  ['/blog/hotel-laundry-service-orlando', {
    funnelId: 'hotel-guide',
    funnelName: 'Orlando Hotel Pickup Guide',
    funnelCodes: ['SEO-HOTEL-GUIDE-V1'],
    intent: 'Guia decisório de opções, handoff e confirmação em hotel',
    audience: 'Hóspedes pesquisando como hotel laundry pickup funciona',
    action: 'Entender a alternativa e confirmar o procedimento do hotel',
    campaignRole: 'Conteúdo assistido que encaminha para a money page',
    sourceLifecycle: 'reviewed_candidate'
  }],
  ['/blog/laundry-before-checkout-orlando', {
    funnelId: 'before-checkout',
    funnelName: 'Laundry Before Checkout',
    funnelCodes: ['SEO-BEFORE-CHECKOUT-V1'],
    intent: 'Urgência de roupa limpa antes de checkout, voo ou próxima hospedagem',
    audience: 'Hóspedes com prazo de saída curto',
    action: 'Enviar local, prazo exato e carga para avaliação de Express',
    campaignRole: 'Funil de urgência separado do resort next-day',
    sourceLifecycle: 'reviewed_candidate'
  }]
]);

function routeToSourceFile(route) {
  const rewriteSources = {
    '/comforter': 'comforter-cleaning.html',
    '/carpet': 'carpet-cleaning.html',
    '/shoes': 'shoe-cleaning.html',
    '/upholstery': 'upholstery-cleaning.html',
    '/vacation': 'vacation-rental.html',
    '/mattress': 'mattress-cleaning.html',
    '/area-rug': 'area-rug-cleaning.html',
    '/curtain': 'curtain-cleaning.html'
  };
  if (rewriteSources[route]) return rewriteSources[route];
  if (route === '/') return 'index.html';
  if (route === '/blog') return 'blog/index.html';
  return `${route.slice(1)}.html`;
}

function entries(defaults, routes) {
  return routes.map((route) => ({
    ...defaults,
    assetId: stableAssetId(route),
    canonicalPath: route,
    sourceFile: routeToSourceFile(route),
    sourceLifecycle: defaults.sourceLifecycle || 'published_source',
    assetRole: defaults.contentType,
    stageRationale: defaults.funnelStage === 'tofu' ? 'Discovery and education before service comparison.' : defaults.funnelStage === 'mofu' ? 'Decision support and solution evaluation.' : defaults.funnelStage === 'bofu' ? 'Commercial or local service intent with a direct next action.' : 'Explicit non-funnel foundation or legal asset.',
    geoScope: defaults.contentType === 'geo-page' ? { type: 'regional', key: route.split('/').pop(), label: route.split('/').pop().replace(/-/g, ' ') } : { type: 'market', key: 'orlando', label: 'Orlando, Florida' },
    nextAction: defaults.funnelStage === 'bofu' ? 'Confirm service availability or continue to the governed conversion path.' : defaults.funnelStage === 'mofu' ? 'Continue to the cluster owner or relevant service decision.' : defaults.funnelStage === 'tofu' ? 'Continue to a relevant guide or service owner.' : 'No acquisition action required.',
    canonicalState: 'self',
    canonicalOwnerPath: route,
    funnelCodes: [],
    ...managedFunnels.get(route)
  }));
}

const core = entries(foundation, ['/', '/about']);
const legal = entries({ ...foundation, contentType: 'legal', mosVisibility: 'inventory' }, ['/privacy-policy']);
const hubs = [
  ...entries({ ...hub, clusterId: 'service-verticals' }, ['/service-areas']),
  ...entries(hub, ['/blog'])
];

const coreCommerce = [
  ...entries({ ...service, clusterId: 'guest-laundry-orlando', pillarPath: '/laundry-pickup-delivery-orlando' }, ['/laundry-pickup-delivery-orlando']),
  ...entries({ ...service, clusterId: 'orlando-options-and-cost', pillarPath: '/laundry-pickup-delivery-orlando' }, ['/plans'])
];

const serviceVerticals = [
  ...entries(service, ['/carpet', '/shoes', '/upholstery', '/mattress', '/area-rug', '/curtain', '/blog/linen-towel-service-orlando']),
  ...entries({ ...service, clusterId: 'comforter-care', pillarPath: '/comforter' }, ['/comforter']),
  ...entries({ ...service, clusterId: 'vacation-rental-hosts', pillarPath: '/vacation' }, ['/vacation'])
];

const guestGuides = entries(article, [
  '/blog/hotel-laundry-service-orlando',
  '/blog/airbnb-laundry-service-orlando',
  '/blog/hotel-vs-pickup-laundry-orlando',
  '/blog/no-car-laundry-orlando',
  '/blog/book-laundry-whatsapp-orlando',
  '/blog/orlando-hotel-no-washer-laundry'
]);

const guestDiscovery = entries({ ...article, funnelStage: 'tofu' }, [
  '/blog/family-vacation-laundry-orlando',
  '/blog/pack-less-orlando-trip-laundry',
  '/blog/laundry-tips-orlando-vacation'
]);

const urgency = entries({
  ...article,
  funnelStage: 'bofu',
  clusterId: 'deadline-and-same-day'
}, [
  '/blog/laundry-before-checkout-orlando',
  '/blog/same-day-laundry-tourists-orlando',
  '/blog/same-day-laundry-orlando',
  '/blog/express-laundry-orlando',
  '/blog/same-day-drop-off-laundry-orlando'
]);

const comparison = entries({ ...article, clusterId: 'orlando-options-and-cost' }, [
  '/blog/laundry-service-orlando',
  '/blog/orlando-laundromat-vs-delivery',
  '/blog/laundry-cost-orlando',
  '/blog/a7-laundry-review'
]);

const geoPages = entries(geo, [
  '/blog/laundry-international-drive-orlando',
  '/blog/laundry-near-universal-orlando',
  '/blog/laundry-winter-garden-fl',
  '/blog/laundry-windermere-fl',
  '/blog/laundry-clermont-fl',
  '/blog/laundry-ocoee-fl',
  '/blog/laundry-kissimmee',
  '/blog/laundry-near-disney-world',
  '/blog/laundry-disney-springs-area',
  '/blog/laundry-champions-gate',
  '/blog/laundry-orlando-airport',
  '/blog/laundry-near-seaworld-orlando',
  '/blog/laundry-lake-buena-vista',
  '/blog/laundry-convention-center-orlando',
  '/blog/laundry-port-canaveral-cruise',
  '/blog/snowbird-laundry-orlando'
]);

const vacationRentalGuest = entries({ ...article, clusterId: 'vacation-rental-guests' }, [
  '/blog/laundry-for-vacation-rental-guests'
]);

const vacationRentalHost = entries({
  ...article,
  clusterId: 'vacation-rental-hosts',
  pillarPath: '/vacation'
}, [
  '/blog/vacation-rental-laundry-orlando',
  '/blog/laundry-subscription-vacation-rental',
  '/blog/reunion-resort-laundry-service',
  '/blog/orlando-vacation-rental-laundry-guide'
]);

const vacationRentalDiscovery = entries({
  ...article,
  funnelStage: 'tofu',
  clusterId: 'vacation-rental-hosts',
  pillarPath: '/vacation'
}, [
  '/blog/vacation-rental-checklist-orlando',
  '/blog/airbnb-host-laundry-tips-orlando',
  '/blog/how-often-wash-vacation-rental-linens'
]);

const comforterCluster = [
  ...entries({ ...article, funnelStage: 'tofu', clusterId: 'comforter-care', pillarPath: '/comforter' }, [
    '/blog/how-to-clean-comforter'
  ]),
  ...entries({ ...service, clusterId: 'comforter-care', pillarPath: '/comforter' }, [
    '/blog/comforter-cleaning-service-orlando',
    '/blog/comforter-cleaning-service-orlando-v2'
  ])
];

const spanish = entries({
  ...article,
  clusterId: 'spanish-orlando-guest',
  pillarPath: '/laundry-pickup-delivery-orlando'
}, ['/blog/lavanderia-a-domicilio-orlando']);

const legacyDiscoveredPages = entries({
  ...geo,
  indexationPolicy: 'adjudication_required',
  sourceLifecycle: 'reviewed_candidate',
  clusterId: 'orlando-geo'
}, ['/blog/laundry-davenport']);

const quarantinedResortPages = entries({
  ...geo,
  clusterId: 'resort-property-review',
  indexationPolicy: 'noindex_review',
  mosVisibility: 'portfolio',
  sourceLifecycle: 'editorial_review'
}, [
  '/blog/laundry-solara-resort',
  '/blog/laundry-encore-resort-reunion',
  '/blog/laundry-storey-lake-resort',
  '/blog/laundry-windsor-hills-resort',
  '/blog/laundry-windsor-island-resort',
  '/blog/laundry-solterra-resort',
  '/blog/laundry-emerald-island-resort',
  '/blog/laundry-paradise-palms-resort',
  '/blog/laundry-terra-verde-resort',
  '/blog/laundry-bella-vida-resort',
  '/blog/laundry-vista-cay-resort',
  '/blog/laundry-margaritaville-resort-orlando',
  '/blog/laundry-sonoma-resort-tapestry',
  '/blog/laundry-veranda-palms-resort',
  '/blog/laundry-regal-oaks-resort',
  '/blog/laundry-oakwater-resort',
  '/blog/laundry-runaway-beach-club',
  '/blog/laundry-magic-village-resort',
  '/blog/laundry-compass-bay-resort',
  '/blog/laundry-villas-seven-dwarfs',
  '/blog/laundry-festival-resort-davenport',
  '/blog/laundry-aviana-resort',
  '/blog/laundry-providence-resort',
  '/blog/laundry-highlands-reserve',
  '/blog/laundry-tuscan-hills-davenport',
  '/blog/laundry-watersong-resort',
  '/blog/laundry-west-haven-davenport',
  '/blog/laundry-oasis-club-championsgate',
  '/blog/laundry-retreat-championsgate',
  '/blog/laundry-balmoral-resort',
  '/blog/laundry-college-park',
  '/blog/laundry-southchase',
  '/blog/laundry-celebration',
  '/blog/laundry-sand-lake-restaurant-row',
  '/blog/laundry-thornton-park'
]);

export const CONTENT_REGISTRY = [
  ...core,
  ...legal,
  ...hubs,
  ...coreCommerce,
  ...serviceVerticals,
  ...guestGuides,
  ...guestDiscovery,
  ...urgency,
  ...comparison,
  ...geoPages,
  ...vacationRentalGuest,
  ...vacationRentalHost,
  ...vacationRentalDiscovery,
  ...comforterCluster,
  ...spanish,
  ...legacyDiscoveredPages,
  ...quarantinedResortPages
];

const clusterById = new Map(CONTENT_CLUSTERS.map((cluster) => [cluster.id, cluster]));
for (const entry of CONTENT_REGISTRY) {
  const cluster = clusterById.get(entry.clusterId);
  entry.clusterOwnerPath = cluster?.ownerPath || null;
  entry.clusterRelation = entry.canonicalPath === cluster?.ownerPath ? 'owner' : 'supporting';
  entry.intentOwnerPath = cluster?.ownerPath || entry.pillarPath;
  entry.assetRole = entry.canonicalPath === '/laundry-pickup-delivery-orlando' ? 'money_page'
    : entry.contentType === 'geo-page' ? 'regional_page'
      : entry.contentType === 'service-page' ? (entry.canonicalPath === '/plans' ? 'pricing' : 'landing_page')
      : entry.contentType === 'article' ? 'article'
        : entry.contentType === 'foundation' ? 'foundation'
          : entry.contentType === 'hub' ? 'hub'
            : entry.contentType === 'legal' ? 'legal' : 'guide';
  entry.journeyStage = entry.funnelStage === 'non_funnel' ? 'not_applicable' : entry.funnelStage;
  entry.sourceLifecycle = entry.sourceLifecycle === 'reviewed_candidate' ? 'source_candidate'
    : entry.sourceLifecycle === 'editorial_review' ? 'quarantined' : entry.sourceLifecycle;
  entry.clusterRole = entry.clusterRelation === 'owner' ? 'intent_owner' : 'supporting';
  entry.parentAssetId = entry.clusterRole === 'intent_owner' ? null : stableAssetId(cluster?.ownerPath || entry.pillarPath);
  entry.geography = entry.contentType === 'geo-page'
    ? { kind: 'region', country: 'US', region: 'FL', locality: 'Orlando', area: entry.geoScope.label }
    : { kind: 'city', country: 'US', region: 'FL', locality: 'Orlando', area: null };
  entry.intent ||= `${entry.clusterId} information and service intent`;
  entry.audience ||= entry.funnelStage === 'non_funnel' ? 'Site visitors requiring foundation or legal information' : 'Orlando laundry-service prospects and customers';
  entry.funnel = entry.funnelId ? { id: entry.funnelId, name: entry.funnelName, codes: entry.funnelCodes, campaignRole: entry.campaignRole } : null;
}

const comforterLegacy = CONTENT_REGISTRY.find((entry) => entry.canonicalPath === '/blog/comforter-cleaning-service-orlando');
const comforterCandidate = CONTENT_REGISTRY.find((entry) => entry.canonicalPath === '/blog/comforter-cleaning-service-orlando-v2');
comforterLegacy.canonicalState = 'adjudication_required';
comforterLegacy.canonicalOwnerPath = '/blog/comforter-cleaning-service-orlando-v2';
comforterCandidate.canonicalState = 'provisional_owner';

export const CLUSTER_REGISTRY = CONTENT_CLUSTERS.map((cluster) => ({
  clusterId: cluster.id,
  topic: cluster.topic,
  canonicalIntentKey: cluster.id.replace(/-/g, '_'),
  intentOwnerAssetId: stableAssetId(cluster.ownerPath),
  hubAssetId: stableAssetId(cluster.ownerPath),
  parentClusterId: cluster.parentClusterId
}));

export const MANAGED_FUNNEL_PATHS = [...managedFunnels.keys()];
