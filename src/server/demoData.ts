/**
 * Built-in mock website demo databases for immediate visual testing,
 * container alignment verification (handling missing fields with null), and multi-page pagination testing.
 */

export interface DemoPage {
  url: string;
  title: string;
  html: (page: number, targetUrl?: string) => string;
  suggestedRecipe: {
    containerSelector: string;
    fields: Array<{ name: string; selector: string; attribute: string }>;
    pagination: { type: string; selector?: string; maxPages: number; delayMs: number };
  };
}

// DummyJSON Sample Product Database
interface DummyProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  stock: number;
  brand: string;
  sku: string;
  reviewsCount: number;
  thumbnail: string;
  badge?: string;
}

const DUMMY_JSON_DATABASE: DummyProduct[] = [
  // Page 1: Tech & Flagship Electronics
  {
    id: 1,
    title: 'iPhone 15 Pro Max (Titanium 256GB)',
    description: 'Forged in titanium with industry-leading A17 Pro chip and 48MP camera system.',
    category: 'smartphones',
    price: 1199.00,
    originalPrice: 1299.00,
    discountPercentage: 7.7,
    rating: 4.89,
    stock: 42,
    brand: 'Apple',
    sku: 'APL-IPH15-PM-256',
    reviewsCount: 124,
    thumbnail: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    badge: 'Best Seller'
  },
  {
    id: 2,
    title: 'Samsung Galaxy S24 Ultra AI Phone',
    description: 'Galaxy AI is here. Epic titanium exterior, built-in S Pen, and 200MP camera.',
    category: 'smartphones',
    price: 1299.99,
    originalPrice: 1419.00,
    discountPercentage: 8.4,
    rating: 4.82,
    stock: 19,
    brand: 'Samsung',
    sku: 'SAM-S24-ULT-512',
    reviewsCount: 98,
    thumbnail: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
    badge: 'Hot Deal'
  },
  {
    id: 3,
    title: 'MacBook Pro 16" M3 Max (36GB RAM)',
    description: 'Liquid Retina XDR display, up to 22 hours battery life, extreme pro performance.',
    category: 'laptops',
    price: 3499.00,
    originalPrice: 3899.00,
    discountPercentage: 10.3,
    rating: 4.95,
    stock: 8,
    brand: 'Apple',
    sku: 'APL-MBP16-M3X',
    reviewsCount: 62,
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    badge: 'Pro Pick'
  },
  {
    id: 4,
    title: 'Dell XPS 15 InfinityEdge OLED Laptop',
    description: '3.5K OLED touchscreen, Intel Core i9, NVIDIA RTX 4070 graphic accelerator.',
    category: 'laptops',
    price: 1899.00,
    originalPrice: 2199.00,
    discountPercentage: 13.6,
    rating: 4.65,
    stock: 14,
    brand: 'Dell',
    sku: 'DEL-XPS15-OLED',
    reviewsCount: 45,
    thumbnail: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80'
  },
  {
    id: 5,
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling',
    description: 'Two processors and eight microphones for unprecedented noise canceling and call quality.',
    category: 'audio',
    price: 348.00,
    originalPrice: 399.99,
    discountPercentage: 13.0,
    rating: 4.78,
    stock: 55,
    brand: 'Sony',
    sku: 'SNY-WH-1000XM5',
    reviewsCount: 215,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    badge: 'Staff Choice'
  },
  {
    id: 6,
    title: 'Bose QuietComfort Ultra Spatial Audio Earbuds',
    description: 'Breakthrough spatial audio and world-class noise cancellation tuned to your ears.',
    category: 'audio',
    price: 299.00,
    // Note: No originalPrice to test null safety in scraper!
    rating: 4.58,
    stock: 28,
    brand: 'Bose',
    sku: 'BSE-QC-ULTRA',
    reviewsCount: 76,
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80'
  },

  // Page 2: Fragrances & Wearables
  {
    id: 7,
    title: 'Chanel Coco Mademoiselle Eau de Parfum',
    description: 'Irresistibly sexy, irrepressibly spirited. An oriental fragrance with strong personality.',
    category: 'fragrances',
    price: 145.00,
    originalPrice: 160.00,
    discountPercentage: 9.4,
    rating: 4.91,
    stock: 60,
    brand: 'Chanel',
    sku: 'CHN-COCO-100',
    reviewsCount: 310,
    thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80',
    badge: 'Luxury'
  },
  {
    id: 8,
    title: 'Dior Sauvage Elixir Concentrated Cologne',
    description: 'An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage.',
    category: 'fragrances',
    price: 180.00,
    originalPrice: 205.00,
    discountPercentage: 12.2,
    rating: 4.85,
    stock: 34,
    brand: 'Dior',
    sku: 'DIR-SAUV-ELX',
    reviewsCount: 184,
    thumbnail: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&q=80'
  },
  {
    id: 9,
    title: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
    description: 'The ultimate sports and adventure watch features a lightweight titanium case.',
    category: 'smartphones',
    price: 799.00,
    // No original price test
    rating: 4.88,
    stock: 15,
    brand: 'Apple',
    sku: 'APL-WTCH-ULT2',
    reviewsCount: 92,
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    badge: 'Rugged'
  },
  {
    id: 10,
    title: 'Garmin Fenix 7X Sapphire Solar Multisport',
    description: 'Solar powered multi-sport GPS smartwatch with scratch-resistant sapphire lens.',
    category: 'smartphones',
    price: 899.99,
    originalPrice: 999.99,
    discountPercentage: 10.0,
    rating: 4.74,
    stock: 7,
    brand: 'Garmin',
    sku: 'GRM-FNX-7XSS',
    reviewsCount: 43,
    thumbnail: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80'
  },
  {
    id: 11,
    title: 'Sony Alpha a7 IV Full-Frame Mirrorless Camera',
    description: '33MP Exmor R CMOS sensor, 4K 60p video recording, and advanced real-time AF tracking.',
    category: 'audio',
    price: 2498.00,
    originalPrice: 2698.00,
    discountPercentage: 7.4,
    rating: 4.92,
    stock: 4,
    brand: 'Sony',
    sku: 'SNY-ILCE-7M4',
    reviewsCount: 88,
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    badge: 'Low Stock'
  },
  {
    id: 12,
    title: 'DJI Mini 4 Pro Drone with RC 2 Controller',
    description: 'Under 249g ultra-light folding drone, 4K/60fps HDR true vertical shooting.',
    category: 'audio',
    price: 1099.00,
    rating: 4.83,
    stock: 22,
    brand: 'DJI',
    sku: 'DJI-MN4P-FMC',
    reviewsCount: 67,
    thumbnail: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400&q=80'
  },

  // Page 3: Home & Ergonomic Workspace
  {
    id: 13,
    title: 'Herman Miller Aeron Ergonomic Office Chair',
    description: 'Ergonomic posturefit SL support, breathable 8Z Pellicle elastomeric suspension mesh.',
    category: 'furniture',
    price: 1445.00,
    originalPrice: 1695.00,
    discountPercentage: 14.7,
    rating: 4.95,
    stock: 11,
    brand: 'Herman Miller',
    sku: 'HM-AERON-B-GR',
    reviewsCount: 156,
    thumbnail: 'https://images.unsplash.com/photo-1580481077195-c29015b6510e?w=400&q=80',
    badge: 'Ergo King'
  },
  {
    id: 14,
    title: 'Autonomous SmartDesk 2 Dual Motor Sit-to-Stand',
    description: 'Heavy-duty steel frame, whisper-quiet electric dual motors lifting up to 310 lbs.',
    category: 'furniture',
    price: 599.00,
    originalPrice: 699.00,
    discountPercentage: 14.3,
    rating: 4.62,
    stock: 0,
    brand: 'Autonomous',
    sku: 'AUT-SD2-PRO',
    reviewsCount: 51,
    thumbnail: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&q=80',
    badge: 'Backorder'
  },
  {
    id: 15,
    title: 'Dyson V15 Detect Absolute Cordless Vacuum',
    description: 'Laser reveals invisible dust. Intelligently optimizes suction and run time on hard floors.',
    category: 'furniture',
    price: 749.99,
    originalPrice: 799.99,
    discountPercentage: 6.3,
    rating: 4.79,
    stock: 31,
    brand: 'Dyson',
    sku: 'DYS-V15-ABS',
    reviewsCount: 204,
    thumbnail: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80'
  },
  {
    id: 16,
    title: 'Philips Hue Smart Color Ambient Light Bar Kit',
    description: 'Enhance your gaming and media setup with 16 million colors syncing dynamically.',
    category: 'furniture',
    price: 199.99,
    rating: 4.54,
    stock: 45,
    brand: 'Philips',
    sku: 'PHL-HUE-PLAY2',
    reviewsCount: 118,
    thumbnail: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&q=80'
  },
  {
    id: 17,
    title: 'Breville Barista Touch Stainless Espresso Machine',
    description: 'Automated touchscreen operation, integrated conical burr grinder, 3-second heatup.',
    category: 'furniture',
    price: 999.95,
    originalPrice: 1199.95,
    discountPercentage: 16.7,
    rating: 4.86,
    stock: 6,
    brand: 'Breville',
    sku: 'BRV-BES880BSS',
    reviewsCount: 94,
    thumbnail: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80',
    badge: 'Barista Choice'
  },
  {
    id: 18,
    title: 'Ninja DualZone Air Fryer with Smart Probe 10-Qt',
    description: '2 independent baskets allow you to cook 2 foods, 2 ways that finish at the same time.',
    category: 'furniture',
    price: 179.99,
    originalPrice: 229.99,
    discountPercentage: 21.7,
    rating: 4.81,
    stock: 65,
    brand: 'Ninja',
    sku: 'NJ-DZ401-10Q',
    reviewsCount: 342,
    thumbnail: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80'
  },

  // Page 4: Fashion, Footwear & Skincare
  {
    id: 19,
    title: "Nike Air Force 1 '07 Premium White Leather",
    description: 'The radiance lives on with crisp leather, bold details, and the right amount of court flair.',
    category: 'fashion',
    price: 130.00,
    originalPrice: 150.00,
    discountPercentage: 13.3,
    rating: 4.73,
    stock: 88,
    brand: 'Nike',
    sku: 'NKE-AF1-07PRM',
    reviewsCount: 420,
    thumbnail: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
    badge: 'Icon'
  },
  {
    id: 20,
    title: 'Adidas Ultraboost Light Carbon Neutral Runners',
    description: 'Experience epic energy return with our lightest BOOST midsole foam ever made.',
    category: 'fashion',
    price: 152.00,
    originalPrice: 190.00,
    discountPercentage: 20.0,
    rating: 4.67,
    stock: 40,
    brand: 'Adidas',
    sku: 'ADS-UB-LGT-BLK',
    reviewsCount: 165,
    thumbnail: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&q=80'
  },
  {
    id: 21,
    title: 'The Ordinary Niacinamide 10% + Zinc 1% (60ml)',
    description: 'High-strength vitamin and mineral blemish formula that smooths and brightens.',
    category: 'skincare',
    price: 11.00,
    rating: 4.68,
    stock: 150,
    brand: 'The Ordinary',
    sku: 'ORD-NIA-60ML',
    reviewsCount: 890,
    thumbnail: 'https://images.unsplash.com/photo-1608248597359-21695e1e1a53?w=400&q=80'
  },
  {
    id: 22,
    title: 'CeraVe Moisturizing Cream with Ceramides 19 oz',
    description: 'Developed with dermatologists. Barrier-restoring formula with 3 essential ceramides.',
    category: 'skincare',
    price: 19.99,
    originalPrice: 24.99,
    discountPercentage: 20.0,
    rating: 4.84,
    stock: 95,
    brand: 'CeraVe',
    sku: 'CRV-CRM-19OZ',
    reviewsCount: 512,
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80'
  },
  {
    id: 23,
    title: 'Organic Extra Virgin Olive Oil Cold-Pressed 1L',
    description: 'Harvested from century-old Mediterranean groves with single estate acidity below 0.3%.',
    category: 'groceries',
    price: 22.50,
    rating: 4.89,
    stock: 78,
    brand: 'Estate Organics',
    sku: 'EST-EVOO-1000',
    reviewsCount: 140,
    thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'
  },
  {
    id: 24,
    title: 'Ceremonial Grade Uji Matcha Green Tea 100g',
    description: 'Stone-ground ceremonial green tea leaves from Kyoto, Japan with sweet umami aroma.',
    category: 'groceries',
    price: 29.95,
    originalPrice: 34.95,
    discountPercentage: 14.3,
    rating: 4.76,
    stock: 35,
    brand: 'Kyoto Tea Craft',
    sku: 'KYO-MAT-100G',
    reviewsCount: 88,
    thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    badge: 'Import'
  }
];

export const DEMO_PAGES: Record<string, DemoPage> = {
  'demo:dummyjson': {
    url: 'demo:dummyjson',
    title: 'DummyJSON Products Database (Live Play Test)',
    suggestedRecipe: {
      containerSelector: 'article.product-card',
      fields: [
        { name: 'product_title', selector: 'h3.product-title a', attribute: 'innerText' },
        { name: 'sale_price', selector: '.sale-price', attribute: 'innerText' },
        { name: 'original_price', selector: '.original-price', attribute: 'innerText' },
        { name: 'discount', selector: '.discount-pill', attribute: 'innerText' },
        { name: 'rating', selector: '.rating-score', attribute: 'innerText' },
        { name: 'stock_status', selector: '.stock-status', attribute: 'innerText' },
        { name: 'brand', selector: '.brand-tag', attribute: 'innerText' },
        { name: 'sku', selector: '.sku-badge', attribute: 'data-sku' },
        { name: 'product_image', selector: '.thumbnail-container img', attribute: 'src' },
        { name: 'product_url', selector: 'h3.product-title a', attribute: 'href' }
      ],
      pagination: {
        type: 'next_link',
        selector: 'li.next > a',
        maxPages: 4,
        delayMs: 600
      }
    },
    html: (page = 1, targetUrl = '') => {
      // Parse category filter if present in URL
      let filtered = [...DUMMY_JSON_DATABASE];
      let activeCategory = 'all';

      if (targetUrl) {
        const catMatch = targetUrl.match(/category=([a-zA-Z0-9_-]+)/);
        if (catMatch && catMatch[1]) {
          activeCategory = catMatch[1].toLowerCase();
          if (activeCategory !== 'all') {
            filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory);
          }
        }
      }

      const PAGE_SIZE = 6;
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const startIndex = (safePage - 1) * PAGE_SIZE;
      const currentProducts = filtered.slice(startIndex, startIndex + PAGE_SIZE);

      const hasNext = safePage < totalPages;
      const hasPrev = safePage > 1;

      const categories = [
        { id: 'all', label: 'All Products' },
        { id: 'smartphones', label: 'Smartphones & Wearables' },
        { id: 'laptops', label: 'Laptops' },
        { id: 'audio', label: 'Audio & Cameras' },
        { id: 'fragrances', label: 'Fragrances' },
        { id: 'furniture', label: 'Home & Furniture' },
        { id: 'fashion', label: 'Fashion & Footwear' },
        { id: 'skincare', label: 'Skincare' }
      ];

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DummyJSON Store Database - Products Catalog</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #e2e8f0;
      line-height: 1.5;
      padding: 24px;
      min-height: 100vh;
    }
    
    header.db-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .db-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #06b6d4, #6366f1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      color: #fff;
      box-shadow: 0 0 16px rgba(99,102,241,0.4);
    }
    
    .header-titles h1 {
      font-size: 20px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }
    
    .header-titles p {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .db-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      background: rgba(6, 182, 212, 0.15);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 600;
    }

    /* Category Navigation */
    .category-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 20px;
      scrollbar-width: thin;
    }
    
    .category-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 8px;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s;
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
    }
    
    .category-pill:hover {
      background: #334155;
      color: #f8fafc;
    }
    
    .category-pill.active {
      background: #0284c7;
      color: #fff;
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.4);
    }

    /* Test Banner */
    .tester-banner {
      background: rgba(30, 27, 75, 0.6);
      border-left: 4px solid #818cf8;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #c7d2fe;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Product Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 22px;
    }

    /* Product Card */
    article.product-card {
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      position: relative;
    }

    article.product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      border-color: #38bdf8;
    }

    .thumbnail-container {
      position: relative;
      height: 180px;
      border-radius: 8px;
      overflow: hidden;
      background: #0a0f1d;
      margin-bottom: 14px;
    }

    .thumbnail-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    article.product-card:hover .thumbnail-container img {
      transform: scale(1.04);
    }

    .card-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      background: #e11d48;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
    }

    .brand-tag {
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sku-badge {
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #64748b;
      background: #0a0f1d;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
    }

    h3.product-title {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 6px;
      color: #f1f5f9;
    }

    h3.product-title a {
      color: inherit;
      text-decoration: none;
    }

    h3.product-title a:hover {
      color: #38bdf8;
      text-decoration: underline;
    }

    p.product-desc {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 12px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .rating-score {
      color: #fbbf24;
      font-weight: 700;
    }

    .reviews-count {
      color: #64748b;
      font-size: 11px;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
      padding-top: 10px;
      border-top: 1px solid #1e293b;
    }

    .sale-price {
      font-size: 20px;
      font-weight: 800;
      color: #4ade80;
      letter-spacing: -0.02em;
    }

    .original-price {
      font-size: 13px;
      color: #64748b;
      text-decoration: line-through;
    }

    .discount-pill {
      font-size: 10px;
      font-weight: 700;
      color: #f43f5e;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }

    .stock-status {
      font-weight: 600;
      color: #22d3ee;
    }

    .stock-status.low {
      color: #fbbf24;
    }

    .stock-status.out {
      color: #f43f5e;
    }

    /* Pagination */
    .pagination-bar {
      margin-top: 36px;
      padding: 16px 0;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: center;
    }

    .pagination-list {
      display: flex;
      list-style: none;
      gap: 8px;
      align-items: center;
    }

    .pagination-list li a {
      display: inline-block;
      padding: 8px 16px;
      background: #1e293b;
      color: #e2e8f0;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #334155;
      transition: all 0.2s;
    }

    .pagination-list li a:hover {
      background: #0284c7;
      color: #fff;
      border-color: #38bdf8;
    }

    .pagination-list li.current {
      font-size: 13px;
      color: #94a3b8;
      padding: 0 10px;
      font-family: ui-monospace, monospace;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="db-header">
    <div class="brand-section">
      <div class="db-logo">DJ</div>
      <div class="header-titles">
        <h1>DummyJSON Products Database</h1>
        <p>Real-world e-commerce schema with containers, nullable attributes, and multi-page crawl</p>
      </div>
    </div>
    <div class="db-badge">Database: ${filtered.length} Records Loaded</div>
  </header>

  <!-- Category Filter Tabs -->
  <nav class="category-tabs" aria-label="Product Categories">
    ${categories.map(c => `
      <a 
        href="demo:dummyjson?category=${c.id}" 
        class="category-pill ${activeCategory === c.id ? 'active' : ''}"
      >
        ${c.label}
      </a>
    `).join('')}
  </nav>

  <!-- Play Test Instructions Banner -->
  <div class="tester-banner">
    <div>
      <strong>Ways to Test:</strong> Click any card in <em>Select Mode</em>, use <em>2-Click Container</em>, or click <em>AI Discover</em> to detect repeating product cards!
    </div>
    <div style="font-family: monospace; font-size: 11px; color: #a5b4fc;">
      Target: <code>article.product-card</code> (Showing ${currentProducts.length} items on Page ${safePage} of ${totalPages})
    </div>
  </div>

  <!-- Products Grid -->
  <main>
    <div class="products-grid">
      ${currentProducts.map(p => `
        <article class="product-card" data-product-id="${p.id}" data-category="${p.category}" data-brand="${p.brand}">
          <div class="thumbnail-container">
            <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
            ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
          </div>

          <div class="meta-row">
            <span class="brand-tag">${p.brand}</span>
            <span class="sku-badge" data-sku="${p.sku}">SKU: ${p.sku}</span>
          </div>

          <h3 class="product-title">
            <a href="demo:dummyjson/product/${p.id}" title="${p.title}">${p.title}</a>
          </h3>

          <p class="product-desc">${p.description}</p>

          <div class="rating-row">
            <span class="rating-score">★ ${p.rating.toFixed(2)}</span>
            <span class="reviews-count">(${p.reviewsCount} verified reviews)</span>
          </div>

          <div class="price-row">
            <span class="sale-price">$${p.price.toFixed(2)}</span>
            ${p.originalPrice ? `<span class="original-price">$${p.originalPrice.toFixed(2)}</span>` : ''}
            ${p.discountPercentage ? `<span class="discount-pill">-${p.discountPercentage.toFixed(1)}% OFF</span>` : ''}
          </div>

          <div class="footer-row">
            <span class="stock-status ${p.stock === 0 ? 'out' : p.stock < 10 ? 'low' : ''}">
              ${p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? `Only ${p.stock} units left` : `In Stock (${p.stock} available)`}
            </span>
            <span style="color: #64748b; font-size: 11px; text-transform: capitalize;">${p.category}</span>
          </div>
        </article>
      `).join('')}
    </div>

    <!-- Multi-page Pagination -->
    <div class="pagination-bar">
      <ul class="pagination-list">
        ${hasPrev ? `<li class="previous"><a href="demo:dummyjson?category=${activeCategory}&page=${safePage - 1}">← Previous</a></li>` : ''}
        <li class="current">Page ${safePage} of ${totalPages}</li>
        ${hasNext ? `<li class="next"><a href="demo:dummyjson?category=${activeCategory}&page=${safePage + 1}">Next Page →</a></li>` : ''}
      </ul>
    </div>
  </main>
</body>
</html>`;
    }
  },

  'demo:products': {
    url: 'demo:products',
    title: 'DummyJSON Store (Alias)',
    suggestedRecipe: {
      containerSelector: 'article.product-card',
      fields: [
        { name: 'product_title', selector: 'h3.product-title a', attribute: 'innerText' },
        { name: 'sale_price', selector: '.sale-price', attribute: 'innerText' },
        { name: 'brand', selector: '.brand-tag', attribute: 'innerText' },
        { name: 'stock_status', selector: '.stock-status', attribute: 'innerText' }
      ],
      pagination: {
        type: 'next_link',
        selector: 'li.next > a',
        maxPages: 4,
        delayMs: 600
      }
    },
    html: (page = 1, targetUrl = '') => DEMO_PAGES['demo:dummyjson'].html(page, targetUrl)
  },

  'demo:books': {
    url: 'demo:books',
    title: 'Books to Scrape Catalog',
    suggestedRecipe: {
      containerSelector: 'ol.row > li',
      fields: [
        { name: 'title', selector: 'h3 > a', attribute: 'title' },
        { name: 'price', selector: 'p.price_color', attribute: 'innerText' },
        { name: 'availability', selector: 'p.instock', attribute: 'innerText' },
        { name: 'rating', selector: 'p.star-rating', attribute: 'class' },
        { name: 'link', selector: 'h3 > a', attribute: 'href' },
        { name: 'cover_image', selector: '.image_container img', attribute: 'src' }
      ],
      pagination: {
        type: 'next_link',
        selector: 'li.next > a',
        maxPages: 3,
        delayMs: 800
      }
    },
    html: (page = 1) => {
      const pageBooks = [
        // Page 1
        [
          { title: 'A Light in the Attic', price: '£51.77', stock: 'In stock', rating: 'Three', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300' },
          { title: 'Tipping the Velvet', price: '£53.74', stock: 'In stock', rating: 'One', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300' },
          { title: 'Soumission', price: '£50.10', stock: 'In stock', rating: 'One', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300' },
          { title: 'Sharp Objects', price: '£47.82', stock: 'In stock', rating: 'Four', img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300' },
          { title: 'Sapiens: A Brief History of Humankind', price: '£54.23', stock: 'In stock', rating: 'Five', img: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300' },
          { title: 'The Requiem Red', price: '£22.65', stock: 'Out of stock', rating: 'One', img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300' }
        ],
        // Page 2
        [
          { title: 'The Black Maria', price: '£52.15', stock: 'In stock', rating: 'One', img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300' },
          { title: 'Starving Hearts (Triangular Trade Trilogy #1)', price: '£13.99', stock: 'In stock', rating: 'Two', img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300' },
          { title: "Shakespeare's Sonnets", price: '£20.66', stock: 'In stock', rating: 'Four', img: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=300' },
          { title: 'Set Me Free', price: '£17.46', stock: 'In stock', rating: 'Five', img: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300' }
        ],
        // Page 3
        [
          { title: 'Scott Pilgrim\'s Precious Little Life', price: '£52.29', stock: 'In stock', rating: 'Five', img: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300' },
          { title: 'Rip it Up and Start Again', price: '£35.02', stock: 'In stock', rating: 'Five', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300' },
          { title: 'Our Band Could Be Your Life', price: '£57.25', stock: 'In stock', rating: 'Three', img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=300' }
        ]
      ];

      const currentBooks = pageBooks[page - 1] || pageBooks[0];
      const hasNext = page < 3;
      const hasPrev = page > 1;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>All products | Books to Scrape Catalog</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfdfd; color: #333; line-height: 1.5; padding: 24px; }
    header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 24px; color: #1e293b; }
    .page-indicator { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
    ol.row { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    article.product_pod { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; transition: box-shadow 0.2s; }
    article.product_pod:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .image_container { height: 160px; overflow: hidden; border-radius: 6px; margin-bottom: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
    .image_container img { width: 100%; height: 100%; object-fit: cover; }
    p.star-rating { font-size: 13px; color: #f59e0b; margin-bottom: 8px; font-weight: 600; }
    h3 { font-size: 15px; margin-bottom: 8px; font-weight: 600; line-height: 1.3; }
    h3 a { color: #2563eb; text-decoration: none; }
    h3 a:hover { text-decoration: underline; }
    .product_price { margin-top: auto; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: baseline; }
    p.price_color { font-size: 18px; font-weight: 700; color: #0f172a; }
    p.instock { font-size: 12px; color: #16a34a; font-weight: 500; }
    p.instock.out-of-stock { color: #dc2626; }
    .pager { margin-top: 32px; padding: 16px 0; border-top: 1px solid #e2e8f0; display: flex; justify-content: center; }
    .pager ul { list-style: none; display: flex; gap: 12px; align-items: center; }
    .pager li a { display: inline-block; padding: 8px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
    .pager li a:hover { background: #1d4ed8; }
    .pager .current { font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <header>
    <h1>Books to Scrape Catalog</h1>
    <div class="page-indicator">Catalog Page ${page} of 3</div>
  </header>

  <main>
    <ol class="row">
      ${currentBooks.map((b, idx) => `
        <li class="col-xs-6 col-sm-4 col-md-3">
          <article class="product_pod" data-book-id="b-${page}-${idx + 1}">
            <div class="image_container">
              <a href="/catalogue/book-${page}-${idx + 1}.html">
                <img src="${b.img}" alt="${b.title}" class="thumbnail" />
              </a>
            </div>
            <p class="star-rating ${b.rating}">★ Rating: ${b.rating}</p>
            <h3><a href="/catalogue/book-${page}-${idx + 1}.html" title="${b.title}">${b.title}</a></h3>
            <div class="product_price">
              <p class="price_color">${b.price}</p>
              <p class="instock ${b.stock.includes('Out') ? 'out-of-stock' : ''}">${b.stock}</p>
            </div>
          </article>
        </li>
      `).join('')}
    </ol>

    <div class="pager">
      <ul class="pager-list">
        ${hasPrev ? `<li class="previous"><a href="demo:books?page=${page - 1}">← Previous</a></li>` : ''}
        <li class="current">Page ${page} of 3</li>
        ${hasNext ? `<li class="next"><a href="demo:books?page=${page + 1}">Next →</a></li>` : ''}
      </ul>
    </div>
  </main>
</body>
</html>`;
    }
  },

  'demo:tech-store': {
    url: 'demo:tech-store',
    title: 'CyberTech Electronics (Container Alignment Test)',
    suggestedRecipe: {
      containerSelector: '.product-card',
      fields: [
        { name: 'product_name', selector: '.card-title', attribute: 'innerText' },
        { name: 'discount_price', selector: '.price-sale', attribute: 'innerText' },
        { name: 'original_price', selector: '.price-original', attribute: 'innerText' },
        { name: 'sku_code', selector: '.sku-badge', attribute: 'data-sku' },
        { name: 'in_stock_badge', selector: '.stock-status', attribute: 'innerText' },
        { name: 'product_url', selector: '.card-title a', attribute: 'href' }
      ],
      pagination: {
        type: 'none',
        maxPages: 1,
        delayMs: 500
      }
    },
    html: () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CyberTech Gear Store - Container Alignment Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 28px; }
    h1 { font-size: 26px; color: #38bdf8; margin-bottom: 8px; }
    p.sub { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .product-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; }
    .card-title { font-size: 17px; margin-bottom: 8px; font-weight: 600; }
    .card-title a { color: #f8fafc; text-decoration: none; }
    .card-title a:hover { color: #38bdf8; }
    .prices { display: flex; gap: 10px; align-items: baseline; margin: 12px 0; }
    .price-sale { font-size: 20px; font-weight: 700; color: #4ade80; }
    .price-original { font-size: 14px; text-decoration: line-through; color: #64748b; }
    .badges { display: flex; gap: 8px; align-items: center; }
    .sku-badge { font-size: 11px; background: #0f172a; padding: 3px 8px; border-radius: 4px; color: #94a3b8; font-family: monospace; }
    .stock-status { font-size: 12px; color: #38bdf8; font-weight: 600; }
  </style>
</head>
<body>
  <h1>CyberTech Electronics Catalog</h1>
  <p class="sub">Notice card #2 has NO original_price (not on sale), and card #4 has NO sku_badge. Our container-relative grouping ensures fields output null without misaligning rows!</p>
  
  <div class="grid-container">
    <div class="product-card" data-category="laptops">
      <h3 class="card-title"><a href="/product/zenbook-pro-16">ZenBook Ultra Pro 16" OLED</a></h3>
      <div class="prices">
        <span class="price-sale">$1,399.99</span>
        <span class="price-original">$1,699.99</span>
      </div>
      <div class="badges">
        <span class="sku-badge" data-sku="SKU-ZB16-01">SKU: ZB16-01</span>
        <span class="stock-status">In Stock (12 units)</span>
      </div>
    </div>

    <div class="product-card" data-category="monitors">
      <h3 class="card-title"><a href="/product/ultrawide-4k-34">UltraWide Curved 34" Gaming Monitor</a></h3>
      <div class="prices">
        <span class="price-sale">$599.00</span>
      </div>
      <div class="badges">
        <span class="sku-badge" data-sku="SKU-UW34-09">SKU: UW34-09</span>
        <span class="stock-status">Backorder</span>
      </div>
    </div>

    <div class="product-card" data-category="audio">
      <h3 class="card-title"><a href="/product/anc-headphones-x">Noise Cancelling Studio Headphones</a></h3>
      <div class="prices">
        <span class="price-sale">$249.99</span>
        <span class="price-original">$329.99</span>
      </div>
      <div class="badges">
        <span class="sku-badge" data-sku="SKU-ANC-88">SKU: ANC-88</span>
        <span class="stock-status">In Stock</span>
      </div>
    </div>

    <div class="product-card" data-category="keyboards">
      <h3 class="card-title"><a href="/product/mech-keyboard-rgb">Custom Mechanical Keyboard Wireless</a></h3>
      <div class="prices">
        <span class="price-sale">$119.50</span>
        <span class="price-original">$149.00</span>
      </div>
      <div class="badges">
        <span class="stock-status">In Stock (2 units left)</span>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  'demo:lenskart': {
    url: 'demo:lenskart',
    title: 'Lenskart.com Catalog (Styled-Components & Semantic Tags)',
    suggestedRecipe: {
      containerSelector: 'article[data-product-position]',
      fields: [
        { name: 'product_name', selector: 'h3', attribute: 'innerText' },
        { name: 'sale_price', selector: 'div[aria-label*="Price"] span', attribute: 'innerText' },
        { name: 'original_price', selector: 's', attribute: 'innerText' },
        { name: 'product_url', selector: 'a[data-product-card-link]', attribute: 'href' },
        { name: 'product_id', selector: 'a[data-product-id]', attribute: 'data-product-id' },
        { name: 'image_url', selector: 'img', attribute: 'src' },
        { name: 'position', selector: ':scope', attribute: 'data-product-position' }
      ],
      pagination: {
        type: 'none',
        maxPages: 1,
        delayMs: 500
      }
    },
    html: () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Eyeglasses for Men & Women | Lenskart - Real Sample</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fbfbfb; color: #222; padding: 24px; }
    header { margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 14px; }
    h1 { font-size: 22px; color: #000042; font-weight: 700; }
    p.notice { font-size: 13px; color: #555; margin-top: 4px; }
    section[aria-label="Products"] { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px; }
    article { background: #fff; border: 1px solid #ebebeb; border-radius: 8px; padding: 16px; position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    article:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    article img { max-width: 100%; border-radius: 6px; object-fit: contain; }
    h3 { font-size: 15px; font-weight: 700; color: #000042; margin-top: 12px; margin-bottom: 6px; }
    a { text-decoration: none; color: inherit; }
    div[aria-label^="Price:"] { display: flex; gap: 8px; align-items: baseline; font-size: 14px; margin-top: 4px; }
    div[aria-label^="Price:"] span { font-weight: 700; color: #000042; font-size: 16px; }
    div[aria-label^="Price:"] s { color: #888; font-size: 13px; text-decoration: line-through; }
  </style>
</head>
<body>
  <header>
    <h1>Lenskart Eyeglasses Collection</h1>
    <p class="notice">Real Lenskart DOM sample: Demonstrates semantic &lt;article&gt; tags, strikethrough &lt;s&gt; tags, data-product-position attributes, and Styled-Components hashes.</p>
  </header>
  <section aria-label="Products">
    <article data-product-position="1">
      <div><img alt="Lenskart Hustlr Classic" style="height:170px;width:100%;object-fit:cover" src="https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/dark-night-full-rim-square-air-essentials-la-e15417-w-c10-eyeglasses_227532_1_pdp_15_oct.jpg"></div>
      <div><a href="/lenskart-hustlr-la-e15417-c10-eyeglasses.html"><h3>Lenskart Hustlr Classic</h3><div aria-label="Price: ₹1,500"><span>₹1,500</span><s>₹2,000</s></div></a></div>
    </article>
    <article data-product-position="2">
      <div><img alt="Lenskart Air POP" style="height:170px;width:100%;object-fit:cover" src="https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/black-full-rim-square-lenskart-air-fusion-la-e13069-c1-eyeglasses_g_7876_2_27july23_14_1_2026.jpg"></div>
      <div><a href="/lenskart-air-la-e13033-c1-eyeglasses.html"><h3>Lenskart Air POP</h3><div aria-label="Price: ₹1,500"><span>₹1,500</span><s>₹2,000</s></div></a></div>
    </article>
    <article data-product-position="3">
      <div><img alt="Shunya by Indian Accent" style="height:170px;width:100%;object-fit:cover" src="https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/lenskart-studio-lk-e19803-grey-eyeglasses_247291dsc_3562_26_08_2026.jpg"></div>
      <div><a href="/lenskart-studio-lk-e19803-grey-eyeglass.html"><h3>Shunya by Indian Accent</h3><div aria-label="Price: ₹2,500"><span>₹2,500</span><s>₹3,000</s></div></a></div>
    </article>
    <article data-product-position="4">
      <div><img alt="John Jacobs Social Club" style="height:170px;width:100%;object-fit:cover" src="https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//j/i/john-jacobs-jj-e70550-c1-eyeglasses_255139dsc_2846_20_08_2026.jpg"></div>
      <div><a href="/john-jacobs-jj-e70550-c1-eye.html"><h3>John Jacobs Social Club</h3><div aria-label="Price: ₹4,000"><span>₹4,000</span><s>₹5,000</s></div></a></div>
    </article>
  </section>
</body>
</html>`
  }
};
