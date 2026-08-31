globalThis.A7_MOS_AUDIT_REGISTRY = Object.freeze({
  "schemaVersion": "1.0",
  "storageMode": "append_only_repository",
  "latestAuditId": "2026-08-24-growth-forensic-checkpoint",
  "ledgerTipAuditId": "2026-08-24-google-ads-whatsapp-first-correction",
  "auditCount": 16,
  "audits": [
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-10-meta-comforter-pre-pause",
      "auditDate": "2026-07-10",
      "title": "Meta Ads — comforter pre-pause checkpoint",
      "type": "campaign_snapshot",
      "status": "partial",
      "scope": [
        "meta_ads",
        "comforter"
      ],
      "summary": "Checkpoint documental anterior à pausa da campanha de edredom. Não contém um snapshot MOS normalizado completo.",
      "sources": [
        {
          "name": "Meta Ads campaign snapshot",
          "status": "partial",
          "period": "até 10 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/meta-ads/campaigns/2026-07-laundry-comforter/snapshot-2026-07-10-pre-pause-AC.md",
          "sha256": "756ee7675966ddaed607dd6dca906ce12cb4b2c19cff5ae909b0ebb49f3ffd79"
        }
      ],
      "snapshot": null,
      "previousAuditId": null,
      "previousRecordSha256": null,
      "recordSha256": "4fa722aee62f82c55bcd01170ed23c8469065fa2dd126ac910072d0905352546"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-15-meta-comforter",
      "auditDate": "2026-07-15",
      "title": "Meta Ads — comforter campaign checkpoint",
      "type": "campaign_snapshot",
      "status": "partial",
      "scope": [
        "meta_ads",
        "comforter"
      ],
      "summary": "Checkpoint documental da campanha de edredom. Métricas não presentes no documento permanecem indisponíveis.",
      "sources": [
        {
          "name": "Meta Ads campaign snapshot",
          "status": "partial",
          "period": "até 15 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/meta-ads/campaigns/2026-07-laundry-comforter/snapshot-2026-07-15.md",
          "sha256": "b98010c1b79eab35c0c59456302dccd0c07e2d00ec1c8dbfafa1b8fde48b3bad"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-10-meta-comforter-pre-pause",
      "previousRecordSha256": "4fa722aee62f82c55bcd01170ed23c8469065fa2dd126ac910072d0905352546",
      "recordSha256": "baf6c1d96eed1fe60dda8b2e4d494159a4c47df366d8a850eaad1d34085ec0c2"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-16-site-cro-audit",
      "auditDate": "2026-07-16",
      "title": "Site — auditoria de mensagem e conversão",
      "type": "audit_report",
      "status": "partial",
      "scope": [
        "site",
        "cro",
        "conversion"
      ],
      "summary": "Relatório de CRO datado de 16 de julho, localizado durante a auditoria final do registro e acrescentado sem reescrever os registros anteriores.",
      "sources": [
        {
          "name": "Site CRO audit report",
          "status": "verified",
          "period": "16 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/SITE-CRO-AUDIT.md",
          "sha256": "eb245e1df8d0edaed5dd9ca4f71d50b6ff379a2aa628f7841ff9339cdb04dd03"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-08-06-seo-tracking-cleanup",
      "previousRecordSha256": "0db0b89481efb3da92c29309cbb529e626882d37fe0f58a95b4ad1abb66df568",
      "recordSha256": "8379d0b0bf0f9300560bed41d996417b161350bf04c4cc7e43cf8cf3b7d28608"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-22-ga4-gsc-evidence",
      "auditDate": "2026-07-22",
      "title": "GA4 e Search Console — pacote de evidências",
      "type": "evidence_capture",
      "status": "partial",
      "scope": [
        "ga4",
        "search_console",
        "seo"
      ],
      "summary": "Exportações auditáveis de GA4 e Search Console preservadas com seus períodos originais.",
      "sources": [
        {
          "name": "Google Analytics 4 exports",
          "status": "verified",
          "period": "22 jun–21 jul 2026 e comparativos documentados"
        },
        {
          "name": "Google Search Console exports",
          "status": "verified",
          "period": "períodos declarados nos arquivos"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_CAMPAIGNS.csv",
          "sha256": "44d512528742af9e4d191468a9be4cee87e20042c40b4330279f3cc05d63fcbe"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_DAILY_DEVICE_USERS.csv",
          "sha256": "ffa8c36e9ba742ea9166cc5db0b0524d1177145dcfecfc26b9791016f71912da"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_ECOMMERCE_EMPTY.csv",
          "sha256": "2683e7ab11a697bb8909bdbf8437fc8e485adecf0b9f96701d6b2e51f5f47e35"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_EVENTS.csv",
          "sha256": "13b2c0cf9a04e38726fc6ef2b10a28139f8b61214576931f3cb0a5037e86f124"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_GEOGRAPHY_COUNTRY.csv",
          "sha256": "151ff92fb5ccfd8f2de8c4c7e73a0665d032304c5ac8ab4d1eb1dada113665c7"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_KEY_EVENTS_LEADS.csv",
          "sha256": "9ca92072c04ee61f3420b30930eda8b7f8d12b64f9f5c3e6bce997fc4f176c56"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_LANDING_PAGES.csv",
          "sha256": "72352825f07fb4bae3ba243cf3b123f17cd5aa1e62df486fb850197695c18458"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_PAGES_SCREENS.csv",
          "sha256": "0cc660d566f045b528e507d9e65d7fdd0b5354df7f2c673d9b1433ab498c626b"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_SOURCE_MEDIUM.csv",
          "sha256": "6b9828780e18165b0ddaa0c9e2117a4209402d2d207a9b1d36c879c6bbe86e54"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_TECHNOLOGY_BROWSER.csv",
          "sha256": "2443c37491bd4c5546e37cde5ff94f74d80748f87ee16699d5f886ee43336dc1"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_TRAFFIC_ACQUISITION.csv",
          "sha256": "3ace4263fd9d64431ca371e40613aa5b3d0895031b564dd9ece17700eac6af26"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_2026-06-22_2026-07-21_USER_ACQUISITION.csv",
          "sha256": "4667b44e4cb15a8d6edf46664dd800f87c489e378ffe20f74b3677498e920611"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_COMPARISON_2026-07-03_2026-07-10.csv",
          "sha256": "6c1837385361549af63c058c7ff376932e7696ee079b9cddb127b3cda3010e54"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/A7_GA4_COMPARISON_2026-07-11_2026-07-21.csv",
          "sha256": "80e9c02b7e9ba9933c1373a34284e44b1de94dee65fae9881ef5184ff811ac01"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/ga4/README.md",
          "sha256": "8c253f5e8616b9be47db98e9d24237ef7914c9c3e2285beabe76963bd64e44a5"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/A7_GSC_2026-06-30_2026-07-17_PERFORMANCE.xlsx",
          "sha256": "252cadfa7137d0ed77b4c5fac725218bd573f229b763f3992186870abb81bfae"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/A7_GSC_2026-07-09_COVERAGE.xlsx",
          "sha256": "25c99ed854f66ff83a02151d3701d593bfa88eb2194e5bf5c76765c28f5a4660"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/A7_GSC_2026-07-20_BREADCRUMBS.xlsx",
          "sha256": "a85b57f36ab9433e5bade04a9cca7430e76256943ce2fb7d3bbea9a63dbd7f38"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/A7_GSC_2026-07-20_REVIEW_SNIPPETS.xlsx",
          "sha256": "cc0719a49b2849dbf5da4c4fbb2e35cb800ca2bdb783f64d43ba1cf553004fa0"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/A7_GSC_2026-07-21_HTTPS.xlsx",
          "sha256": "764ab5e1f8b420d7f73f937f2f85758121c881879d9418297ee38e80eb7e35c4"
        },
        {
          "path": "docs/audits/evidence/2026-07-22/gsc/README.md",
          "sha256": "6a923e13f1f26566e933e2cd0957c9b68f67fd0be1d45158217f1c57922359e6"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-15-meta-comforter",
      "previousRecordSha256": "baf6c1d96eed1fe60dda8b2e4d494159a4c47df366d8a850eaad1d34085ec0c2",
      "recordSha256": "4239b7afc0f891f52bd0258971797120da30f157093f3daa648c7ef5cc17218c"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-24-google-ads-meta-organic",
      "auditDate": "2026-07-24",
      "title": "Google Ads e Meta orgânico — evidências",
      "type": "evidence_capture",
      "status": "partial",
      "scope": [
        "google_ads",
        "meta_organic"
      ],
      "summary": "Evidências documentais de Google Ads e exportações orgânicas do Meta; não representam estado atual das plataformas.",
      "sources": [
        {
          "name": "Google Ads audit evidence",
          "status": "partial",
          "period": "até 24 jul 2026"
        },
        {
          "name": "Meta organic exports",
          "status": "verified",
          "period": "24 jun–24 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/audits/evidence/2026-07-24/google-ads/README.md",
          "sha256": "9cdc619bb90958315fbb6df43d46a06922b7e05044f97264b1bac9bd76971cff"
        },
        {
          "path": "docs/audits/evidence/2026-07-24/meta-organic/A7_META_FB_PERFORMANCE_2026-06-24_2026-07-24.csv",
          "sha256": "ddd5873a2a6977f44f1af0dd7df416170438c6eedc897fdb82261ff104c2de16"
        },
        {
          "path": "docs/audits/evidence/2026-07-24/meta-organic/A7_META_FB_PUBLISHED_2026-06-24_2026-07-24.csv",
          "sha256": "d627c3f9f8dcb01b29ba21ecc529d86c8f194ae6190430fd7882d8dc0111ac50"
        },
        {
          "path": "docs/audits/evidence/2026-07-24/meta-organic/A7_META_IG_PUBLISHED_PERFORMANCE_2026-06-24_2026-07-24.csv",
          "sha256": "a9aa73b9011beeea099d6aa4080ff767599a7a8f94ea0255efbf9f532668ed7f"
        },
        {
          "path": "docs/audits/evidence/2026-07-24/meta-organic/README.md",
          "sha256": "4f6b50206dad27534723dab0623117ec207740c4d0a9407956dc96a1adca4631"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-22-ga4-gsc-evidence",
      "previousRecordSha256": "4239b7afc0f891f52bd0258971797120da30f157093f3daa648c7ef5cc17218c",
      "recordSha256": "d3f1ca627dcc15da03546ea59403ff68325dd31908e06d3c3fce91ac7ef34115"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-27-mos-kpi-snapshot",
      "auditDate": "2026-07-27",
      "title": "MOS — snapshot completo de KPIs",
      "type": "kpi_snapshot",
      "status": "complete",
      "scope": [
        "mos",
        "ga4",
        "search_console",
        "google_ads",
        "meta_ads",
        "meta_organic",
        "revenue"
      ],
      "summary": "Snapshot completo e datado que antes era o único estado histórico carregado pelo MOS.",
      "sources": [
        {
          "name": "MOS versioned KPI snapshot",
          "status": "verified",
          "period": "períodos individuais preservados por métrica"
        }
      ],
      "metrics": [
        {
          "id": "search_clicks",
          "label": "Cliques orgânicos",
          "value": 17,
          "format": "integer",
          "source": "Google Search Console",
          "period": "30 jun–17 jul de 2026",
          "status": "verified"
        },
        {
          "id": "search_impressions",
          "label": "Impressões na busca",
          "value": 1145,
          "format": "compact",
          "source": "Google Search Console",
          "period": "30 jun–17 jul de 2026",
          "status": "verified"
        },
        {
          "id": "search_ctr",
          "label": "CTR orgânico",
          "value": 1.5,
          "format": "percent",
          "source": "Google Search Console",
          "period": "30 jun–17 jul de 2026",
          "status": "verified"
        },
        {
          "id": "search_position",
          "label": "Posição média",
          "value": 19.1,
          "format": "decimal",
          "source": "Google Search Console",
          "period": "30 jun–17 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_organic_feed_pieces",
          "label": "Conteúdos únicos de feed",
          "value": 12,
          "format": "integer",
          "source": "Meta Business Suite · exportações orgânicas",
          "period": "24 jun–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_organic_ig_views",
          "label": "Visualizações orgânicas no Instagram",
          "value": 562,
          "format": "integer",
          "source": "Meta Business Suite · Instagram",
          "period": "24 jun–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_organic_fb_views",
          "label": "Visualizações orgânicas no Facebook",
          "value": 206,
          "format": "integer",
          "source": "Meta Business Suite · Facebook",
          "period": "24 jun–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_organic_ig_likes",
          "label": "Curtidas orgânicas no Instagram",
          "value": 35,
          "format": "integer",
          "source": "Meta Business Suite · Instagram",
          "period": "24 jun–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_spend",
          "label": "Investimento no Meta Ads",
          "value": 543.17,
          "format": "usd",
          "source": "Meta Ads · conta 650201661142284",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "meta_conversations",
          "label": "Conversas no WhatsApp",
          "value": 27,
          "format": "integer",
          "source": "Meta Ads · conversas por mensagem iniciadas",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "revenue",
          "label": "Receita bruta informada",
          "value": 491,
          "format": "usd",
          "source": "Relato do proprietário",
          "period": "22 jun–21 jul de 2026",
          "status": "owner_reported"
        },
        {
          "id": "roas",
          "label": "ROAS bruto mesclado",
          "value": 0.9,
          "format": "ratio",
          "source": "Meta Ads + relato do proprietário",
          "period": "22 jun–21 jul de 2026",
          "status": "owner_reported"
        },
        {
          "id": "ga4_active_users",
          "label": "Usuários ativos no GA4",
          "value": 68,
          "format": "integer",
          "source": "Google Analytics 4",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "ga4_sessions",
          "label": "Sessões no GA4",
          "value": 101,
          "format": "integer",
          "source": "Google Analytics 4",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "ga4_engagement",
          "label": "Taxa de engajamento",
          "value": 47.52,
          "format": "percent",
          "source": "Google Analytics 4",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "ga4_key_events",
          "label": "Eventos principais do GA4",
          "value": 17,
          "format": "integer",
          "source": "Google Analytics 4",
          "period": "22 jun–21 jul de 2026",
          "status": "verified"
        },
        {
          "id": "google_ads_spend",
          "label": "Investimento histórico no Google Ads",
          "value": 4714.27,
          "format": "brl",
          "source": "Google Ads · conta 290-113-2891",
          "period": "2 jun de 2025–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "google_ads_calls",
          "label": "Chamadas registradas como conversão",
          "value": 18,
          "format": "integer",
          "source": "Google Ads · conversões usadas pelas campanhas",
          "period": "2 jun de 2025–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "google_ads_cpa",
          "label": "CPA médio por chamada",
          "value": 261.9,
          "format": "brl",
          "source": "Google Ads · conta 290-113-2891",
          "period": "2 jun de 2025–24 jul de 2026",
          "status": "verified"
        },
        {
          "id": "google_ads_revenue",
          "label": "Receita atribuída ao Google Ads",
          "value": null,
          "format": "brl",
          "source": "Google Ads · metas de vendas",
          "period": "2 jun de 2025–24 jul de 2026",
          "status": "not_integrated"
        },
        {
          "id": "google_ads_roas",
          "label": "ROAS do Google Ads",
          "value": null,
          "format": "ratio",
          "source": "Google Ads · metas de vendas",
          "period": "2 jun de 2025–24 jul de 2026",
          "status": "not_integrated"
        }
      ],
      "evidence": [],
      "snapshot": {
        "path": "mos-data/snapshots/2026-07-27-mos-kpis.js",
        "sha256": "fc3d0b6c82544eaef801e37a087d2099b01c9b72f73ebfaf4857f5fe17a6c380"
      },
      "previousAuditId": "2026-07-24-google-ads-meta-organic",
      "previousRecordSha256": "d3f1ca627dcc15da03546ea59403ff68325dd31908e06d3c3fce91ac7ef34115",
      "recordSha256": "2d5e3586374e9e503904ca9dbf8102ae6b95efe7487cdd5a2a5ae2af3e9447ea"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-28-meta-guest-reactivation",
      "auditDate": "2026-07-28",
      "title": "Meta Ads — guest laundry reactivation checkpoint",
      "type": "campaign_snapshot",
      "status": "partial",
      "scope": [
        "meta_ads",
        "guest_laundry"
      ],
      "summary": "Checkpoint documental da tentativa de reativação da campanha manual de guest laundry.",
      "sources": [
        {
          "name": "Meta Ads campaign snapshot",
          "status": "partial",
          "period": "28 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/meta-ads/campaigns/2026-07-guest-laundry-manual/snapshot-2026-07-28-reactivation.md",
          "sha256": "245178cc1aa75518df8df8aa1a9aee234a708cdc899e1cc2494dc5fbeeab232e"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-27-mos-kpi-snapshot",
      "previousRecordSha256": "2d5e3586374e9e503904ca9dbf8102ae6b95efe7487cdd5a2a5ae2af3e9447ea",
      "recordSha256": "d93a7887afda95f7cbf17c07117b496b0fdf4fda643508acfc07fd18029bcd47"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-29-google-ads-conversion-tracking",
      "auditDate": "2026-07-29",
      "title": "Google Ads — auditoria de conversion tracking",
      "type": "audit_report",
      "status": "partial",
      "scope": [
        "google_ads",
        "conversion_tracking"
      ],
      "summary": "Relatório de auditoria do rastreamento de conversões do Google Ads.",
      "sources": [
        {
          "name": "Audit report",
          "status": "verified",
          "period": "29 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/audits/2026-07-29-google-ads-conversion-tracking.md",
          "sha256": "98aa23ee52a107bc91a6fb26bb0009d70272b7c5afd43da7b7d6bc19b271844a"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-28-meta-guest-reactivation",
      "previousRecordSha256": "d93a7887afda95f7cbf17c07117b496b0fdf4fda643508acfc07fd18029bcd47",
      "recordSha256": "7f081ec54eef65c83b09a958db3fbbc089a85081ea36162fa87e21609eb7fd48"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-30-consolidated-audit",
      "auditDate": "2026-07-30",
      "title": "MOS — auditoria consolidada",
      "type": "audit_report",
      "status": "partial",
      "scope": [
        "mos",
        "marketing",
        "conversion",
        "seo"
      ],
      "summary": "Relatório consolidado da auditoria disponível em 30 de julho.",
      "sources": [
        {
          "name": "Consolidated audit report",
          "status": "verified",
          "period": "até 30 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/audits/2026-07-30-audit-consolidado.md",
          "sha256": "2bee876169efefe75f0d921c29b18d14e7562559ee3d507d5ab6462acfb12328"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-29-google-ads-conversion-tracking",
      "previousRecordSha256": "7f081ec54eef65c83b09a958db3fbbc089a85081ea36162fa87e21609eb7fd48",
      "recordSha256": "fd4e8a5a0f11bccd9f1c87b46d01e86fbd0435e3d2159aeb11780871627dbff4"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-30-whatsapp-audit",
      "auditDate": "2026-07-30",
      "title": "WhatsApp — auditoria de atendimento",
      "type": "audit_report",
      "status": "partial",
      "scope": [
        "whatsapp",
        "conversion",
        "customer_service"
      ],
      "summary": "Auditoria de atendimento com errata e direcionamento corretivo preservados; acrescentada como backfill sem alterar a cadeia anterior.",
      "sources": [
        {
          "name": "WhatsApp audit report",
          "status": "partial",
          "period": "30–31 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/DIRECIONAMENTO-AGOSTO-2026.md",
          "sha256": "136c0893894dc95610872ea9a3a8929fb3693103ff4ed18b3e844383445b4eae"
        },
        {
          "path": "marketing/AUDITORIA-WHATSAPP-2026-07-30.md",
          "sha256": "bd0ae437dd3c4549ca6646b4fef8c51efd1625c47ad5ea2835d4ffa2bb9e6e50"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-16-site-cro-audit",
      "previousRecordSha256": "8379d0b0bf0f9300560bed41d996417b161350bf04c4cc7e43cf8cf3b7d28608",
      "recordSha256": "b261677de8a71736f2ddf24b17a1da6580484300e776bcec6dce6da50da8d71b"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-07-31-whatsapp-reconciliation",
      "auditDate": "2026-07-31",
      "title": "WhatsApp — status operacional e reconciliação",
      "type": "operational_reconciliation",
      "status": "partial",
      "scope": [
        "whatsapp",
        "conversion",
        "revenue"
      ],
      "summary": "Status operacional e arquivo de reconciliação preservados; registros manuais não são promovidos a dados ao vivo.",
      "sources": [
        {
          "name": "WhatsApp operational records",
          "status": "partial",
          "period": "31 jul 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/data/reconciliacao-whatsapp-2026-07-31.csv",
          "sha256": "ff96da7458f490b3fdaad9ded79604dfa0d7e3755cf365d3ab6f966714b65156"
        },
        {
          "path": "marketing/whatsapp/STATUS-OPERACIONAL-2026-07-31.md",
          "sha256": "301c8ef97109dd2c91fee1f349b69f480e915d7cd939390f935db854079d59a8"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-30-consolidated-audit",
      "previousRecordSha256": "fd4e8a5a0f11bccd9f1c87b46d01e86fbd0435e3d2159aeb11780871627dbff4",
      "recordSha256": "9ee2a94056a8cec7837a0680aaf30309f05e56ca1bf8924f4e7525e62d4a5e4e"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-08-06-seo-tracking-cleanup",
      "auditDate": "2026-08-06",
      "title": "SEO e tracking — auditoria de limpeza",
      "type": "audit_report",
      "status": "partial",
      "scope": [
        "seo",
        "tracking"
      ],
      "summary": "Relatório da limpeza de SEO e tracking, preservado como checkpoint posterior à auditoria consolidada.",
      "sources": [
        {
          "name": "SEO/tracking audit report",
          "status": "verified",
          "period": "6 ago 2026"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "docs/audits/2026-08-06-seo-tracking-cleanup.md",
          "sha256": "38376d41fd57a48a1abbc6feb30d3a1c2ca4ff5175cc998cf94477c82ebd5ac8"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-31-whatsapp-reconciliation",
      "previousRecordSha256": "9ee2a94056a8cec7837a0680aaf30309f05e56ca1bf8924f4e7525e62d4a5e4e",
      "recordSha256": "0db0b89481efb3da92c29309cbb529e626882d37fe0f58a95b4ad1abb66df568"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-08-24-attribution-canonical-release",
      "auditDate": "2026-08-24",
      "title": "Attribution and Lake Buena Vista canonical production release",
      "type": "production_release",
      "status": "complete",
      "scope": [
        "public deployment",
        "Stripe attribution",
        "GA4 referral handling",
        "Lake Buena Vista redirect",
        "rollback"
      ],
      "summary": "The exact tested Preview was promoted without rebuild. Production hashes match local and Preview artifacts; the legacy Lake Buena Vista HTML route redirects permanently, the transactional page is noindex and APIs fail closed.",
      "sources": [
        {
          "name": "Vercel Preview and production deployments",
          "status": "verified",
          "period": "2026-08-24"
        },
        {
          "name": "Public a7laundry.com HTTP smoke",
          "status": "verified",
          "period": "2026-08-24"
        }
      ],
      "metrics": [],
      "evidence": [
        {
          "path": "marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ATTRIBUTION-CANONICAL-2026-08-24.md",
          "sha256": "18b07f6a3fcdb98728737db4ab63e5cf02578ef2983f73b0d4f7d0abb90cd9d0"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-08-24-google-ads-purchase-led-goal",
      "previousRecordSha256": "edb9615b4f0876c1743ce4ac6fc636029a25e6a70b62f9df7b111b073aa535a7",
      "recordSha256": "90094e2b365a0dcda0fd76df60446559a57cfc7703ef03636586968b07cbb878"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-08-24-google-ads-purchase-led-goal",
      "auditDate": "2026-08-24",
      "title": "Google Ads WhatsApp moved to secondary observation",
      "type": "google_ads_conversion_governance",
      "status": "complete",
      "scope": [
        "Google Ads account 290-113-2891",
        "conversion actions",
        "bid optimization",
        "rollback"
      ],
      "summary": "The WhatsApp click action was changed from primary to secondary and verified after reload. Stripe purchase remains primary. Click intent stays available in All conversions but no longer optimizes bidding by default.",
      "sources": [
        {
          "name": "Google Ads owner-authenticated account UI",
          "status": "verified",
          "period": "changed and reloaded 2026-08-24; visible performance window 2026-07-25 to 2026-08-23"
        }
      ],
      "metrics": [
        {
          "id": "google_ads_primary_stripe_purchases",
          "label": "Primary Stripe purchase all conversions",
          "value": 11,
          "format": "integer",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        },
        {
          "id": "google_ads_secondary_whatsapp_clicks",
          "label": "WhatsApp clicks retained as secondary observations",
          "value": 47,
          "format": "integer",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        },
        {
          "id": "google_ads_purchase_value_brl",
          "label": "Stripe purchase all-conversion value",
          "value": 5750.46,
          "format": "brl",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        }
      ],
      "evidence": [
        {
          "path": "marketing/google-ads/2026-07-guest-laundry-search/GOOGLE-ADS-CONVERSION-GOAL-CHANGE-2026-08-24.md",
          "sha256": "1c729ee3832c8e9caabe1d22843aff7ddc2c164d0331ac2642ad8940e50a2428"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-08-24-growth-forensic-checkpoint",
      "previousRecordSha256": "da3999117ab66285074c928fdc15d5127994caa8952bbb92b68d3aae6c2ccbf0",
      "recordSha256": "edb9615b4f0876c1743ce4ac6fc636029a25e6a70b62f9df7b111b073aa535a7"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-08-24-google-ads-whatsapp-first-correction",
      "auditDate": "2026-08-24",
      "title": "Google Ads corrected to WhatsApp-first funnel entry",
      "type": "google_ads_conversion_governance",
      "status": "complete",
      "scope": [
        "Google Ads account 290-113-2891",
        "conversion actions",
        "WhatsApp-first acquisition",
        "Stripe financial observation",
        "Claude audit adjudication"
      ],
      "summary": "After the owner confirmed that every sale begins in WhatsApp, the temporary purchase-led goal state was superseded. WhatsApp was restored to primary as the mandatory funnel-entry proxy and Stripe purchase was changed to secondary financial observation; both persisted after reload. The external 30-day audit was adjudicated without applying its weak-sample bid, schedule, device, geography, keyword or budget mutations.",
      "sources": [
        {
          "name": "Google Ads owner-authenticated account UI",
          "status": "verified",
          "period": "changed and reloaded 2026-08-24; visible performance window 2026-07-25 to 2026-08-23"
        },
        {
          "name": "Owner-confirmed mandatory WhatsApp funnel entry",
          "status": "owner_reported",
          "period": "confirmed 2026-08-24"
        },
        {
          "name": "Claude Code artifact 71a7a261-585f-4318-83a4-bd92e606546c",
          "status": "verified",
          "period": "audit window 2026-07-25 to 2026-08-23; read 2026-08-24"
        }
      ],
      "metrics": [
        {
          "id": "google_ads_primary_whatsapp_clicks",
          "label": "WhatsApp clicks represented by current primary action",
          "value": 47,
          "format": "integer",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        },
        {
          "id": "google_ads_secondary_stripe_purchases",
          "label": "Stripe purchases retained as secondary financial observations",
          "value": 11,
          "format": "integer",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        },
        {
          "id": "google_ads_secondary_stripe_value_brl",
          "label": "Stripe purchase all-conversion value retained for reconciliation",
          "value": 5750.46,
          "format": "brl",
          "source": "Google Ads account UI",
          "period": "2026-07-25/2026-08-23",
          "status": "prechange_observed"
        }
      ],
      "evidence": [
        {
          "path": "marketing/google-ads/2026-07-guest-laundry-search/CLAUDE-AUDIT-WHATSAPP-FIRST-ADJUDICATION-2026-08-24.md",
          "sha256": "3f6db370485a85d4e7992dbbd54a02fe8589ce96d8d04774eaa734414998a7e0"
        },
        {
          "path": "marketing/google-ads/2026-07-guest-laundry-search/GOOGLE-ADS-WHATSAPP-FIRST-CORRECTION-2026-08-24.md",
          "sha256": "c29a4a8b04e26803b81f97c74d43a504dccb5ebce26689aa2df526289623a1fd"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-08-24-attribution-canonical-release",
      "previousRecordSha256": "90094e2b365a0dcda0fd76df60446559a57cfc7703ef03636586968b07cbb878",
      "recordSha256": "f65222660aba27a40972076d248802fedddc9d41bb9fd762eed108f8232952f4"
    },
    {
      "schemaVersion": "1.0",
      "auditId": "2026-08-24-growth-forensic-checkpoint",
      "auditDate": "2026-08-24",
      "title": "24-day GA4, GSC and paid-media forensic checkpoint",
      "type": "growth_measurement_forensic",
      "status": "partial",
      "scope": [
        "GA4",
        "Search Console",
        "Google Ads",
        "Meta Ads",
        "canonical URLs",
        "Stripe attribution"
      ],
      "summary": "Traffic and verified purchase volume increased, but GA4 channel revenue is not decision-grade because the Stripe confirmation route appears as acquisition and Organic Shopping owns all reported revenue. Lake Buena Vista traffic is split across clean and .html paths. Meta organic Orlando remains unavailable.",
      "sources": [
        {
          "name": "GA4 property 543807649",
          "status": "verified",
          "period": "2026-08-01 to 2026-08-24 compared with 2026-07-08 to 2026-07-31"
        },
        {
          "name": "Search Console sc-domain:a7laundry.com",
          "status": "verified",
          "period": "2026-08-01 to 2026-08-24 compared with 2026-07-08 to 2026-07-31"
        },
        {
          "name": "Google Ads owner-supplied Claude Code artifact",
          "status": "partial",
          "period": "2026-07-25 to 2026-08-23"
        },
        {
          "name": "Meta Ads USA account state",
          "status": "verified",
          "period": "observed 2026-08-24"
        },
        {
          "name": "Meta organic Orlando",
          "status": "unavailable",
          "period": "2026-08-01 to 2026-08-24"
        }
      ],
      "metrics": [
        {
          "id": "ga4_active_users",
          "label": "GA4 active users",
          "value": 334,
          "format": "integer",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "ga4_sessions",
          "label": "GA4 sessions",
          "value": 444,
          "format": "integer",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "ga4_engagement_rate",
          "label": "GA4 engagement rate",
          "value": 68.92,
          "format": "percent",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "ga4_whatsapp_clicks",
          "label": "GA4 WhatsApp clicks",
          "value": 110,
          "format": "integer",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "contact_intent_only"
        },
        {
          "id": "ga4_purchase_events",
          "label": "GA4 verified purchase events",
          "value": 30,
          "format": "integer",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "ga4_revenue_usd",
          "label": "GA4 reported revenue",
          "value": 3445.8,
          "format": "usd",
          "source": "GA4",
          "period": "2026-08-01/2026-08-24",
          "status": "channel_attribution_unreliable"
        },
        {
          "id": "gsc_clicks",
          "label": "Search Console clicks",
          "value": 28,
          "format": "integer",
          "source": "Search Console",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "gsc_impressions",
          "label": "Search Console impressions",
          "value": 1661,
          "format": "integer",
          "source": "Search Console",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "gsc_ctr",
          "label": "Search Console CTR",
          "value": 1.7,
          "format": "percent",
          "source": "Search Console",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "gsc_average_position",
          "label": "Search Console average position",
          "value": 11.7,
          "format": "decimal",
          "source": "Search Console",
          "period": "2026-08-01/2026-08-24",
          "status": "observed_readonly"
        },
        {
          "id": "google_ads_spend_brl",
          "label": "Google Ads spend",
          "value": 3055.46,
          "format": "brl",
          "source": "Owner-supplied Google Ads artifact",
          "period": "2026-07-25/2026-08-23",
          "status": "period_mismatch_partial"
        },
        {
          "id": "google_ads_stripe_purchases",
          "label": "Google Ads Stripe purchases",
          "value": 11,
          "format": "integer",
          "source": "Owner-supplied Google Ads artifact",
          "period": "2026-07-25/2026-08-23",
          "status": "artifact_reported"
        },
        {
          "id": "meta_ads_active_campaigns",
          "label": "Meta Ads active campaigns",
          "value": 0,
          "format": "integer",
          "source": "Meta Ads USA account state",
          "period": "observed 2026-08-24",
          "status": "observed_readonly"
        }
      ],
      "evidence": [
        {
          "path": "marketing/google-ads/2026-07-guest-laundry-search/FORENSIC-CHECKPOINT-2026-08-24.md",
          "sha256": "88067e9133013d411d0213c90c66c873f1efa5fbea23c3bb544978532f1817a1"
        }
      ],
      "snapshot": null,
      "previousAuditId": "2026-07-30-whatsapp-audit",
      "previousRecordSha256": "b261677de8a71736f2ddf24b17a1da6580484300e776bcec6dce6da50da8d71b",
      "recordSha256": "da3999117ab66285074c928fdc15d5127994caa8952bbb92b68d3aae6c2ccbf0"
    }
  ]
});
