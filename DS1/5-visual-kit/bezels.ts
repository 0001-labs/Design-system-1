/** Measured screen slots from the supplied community file. Artwork is separately licensed. */
export interface Bezel {
  id: string; label: string; width: number; height: number;
  screen: { x: number; y: number; width: number; height: number; radius: number };
  kind: 'phone' | 'tablet'; asset: string; source: { file: string; node: string };
}
export const BEZELS: readonly Bezel[] = [
  {
    "id": "iphone-17-pro-max-deep-blue",
    "label": "iPhone 17 Pro Max \u00b7 Deep Blue",
    "width": 490,
    "height": 1000,
    "screen": {
      "x": 25,
      "y": 22,
      "width": 440,
      "height": 956,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-max-deep-blue.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14156"
    }
  },
  {
    "id": "iphone-17-pro-max-cosmic-orange",
    "label": "iPhone 17 Pro Max \u00b7 Cosmic Orange",
    "width": 490,
    "height": 1000,
    "screen": {
      "x": 25,
      "y": 22,
      "width": 440,
      "height": 956,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-max-cosmic-orange.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14158"
    }
  },
  {
    "id": "iphone-17-pro-max-silver",
    "label": "iPhone 17 Pro Max \u00b7 Silver",
    "width": 490,
    "height": 1000,
    "screen": {
      "x": 25,
      "y": 22,
      "width": 440,
      "height": 956,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-max-silver.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14160"
    }
  },
  {
    "id": "iphone-17-pro-deep-blue",
    "label": "iPhone 17 Pro \u00b7 Deep Blue",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-deep-blue.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14139"
    }
  },
  {
    "id": "iphone-17-pro-cosmic-orange",
    "label": "iPhone 17 Pro \u00b7 Cosmic Orange",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-cosmic-orange.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14141"
    }
  },
  {
    "id": "iphone-17-pro-silver",
    "label": "iPhone 17 Pro \u00b7 Silver",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-pro-silver.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14148"
    }
  },
  {
    "id": "iphone-17-black",
    "label": "iPhone 17 \u00b7 Black",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-black.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14214"
    }
  },
  {
    "id": "iphone-17-lavender",
    "label": "iPhone 17 \u00b7 Lavender",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-lavender.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14201"
    }
  },
  {
    "id": "iphone-17-mist-blue",
    "label": "iPhone 17 \u00b7 Mist Blue",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-mist-blue.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14203"
    }
  },
  {
    "id": "iphone-17-sage",
    "label": "iPhone 17 \u00b7 Sage",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-sage.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14210"
    }
  },
  {
    "id": "iphone-17-white",
    "label": "iPhone 17 \u00b7 White",
    "width": 450,
    "height": 920,
    "screen": {
      "x": 24,
      "y": 23,
      "width": 402,
      "height": 874,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-17-white.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14212"
    }
  },
  {
    "id": "iphone-air-space-black",
    "label": "iPhone Air \u00b7 Space Black",
    "width": 460,
    "height": 960,
    "screen": {
      "x": 20,
      "y": 24,
      "width": 420,
      "height": 912,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-air-space-black.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14177"
    }
  },
  {
    "id": "iphone-air-cloud-white",
    "label": "iPhone Air \u00b7 Cloud White",
    "width": 460,
    "height": 960,
    "screen": {
      "x": 20,
      "y": 24,
      "width": 420,
      "height": 912,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-air-cloud-white.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14173"
    }
  },
  {
    "id": "iphone-air-light-gold",
    "label": "iPhone Air \u00b7 Light Gold",
    "width": 460,
    "height": 960,
    "screen": {
      "x": 20,
      "y": 24,
      "width": 420,
      "height": 912,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-air-light-gold.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14179"
    }
  },
  {
    "id": "iphone-air-sky-blue",
    "label": "iPhone Air \u00b7 Sky Blue",
    "width": 460,
    "height": 960,
    "screen": {
      "x": 20,
      "y": 24,
      "width": 420,
      "height": 912,
      "radius": 58
    },
    "kind": "phone",
    "asset": "assets/iphone-air-sky-blue.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14175"
    }
  },
  {
    "id": "ipad-pro-13-silver",
    "label": "iPad Pro 13 M4 \u00b7 Silver",
    "width": 1500,
    "height": 1150,
    "screen": {
      "x": 62,
      "y": 58,
      "width": 1376,
      "height": 1034,
      "radius": 28
    },
    "kind": "tablet",
    "asset": "assets/ipad-pro-13-silver.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "5456:18569"
    }
  },
  {
    "id": "ipad-pro-13-space-gray",
    "label": "iPad Pro 13 M4 \u00b7 Space Gray",
    "width": 1500,
    "height": 1150,
    "screen": {
      "x": 62,
      "y": 58,
      "width": 1376,
      "height": 1034,
      "radius": 28
    },
    "kind": "tablet",
    "asset": "assets/ipad-pro-13-space-gray.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14233"
    }
  },
  {
    "id": "ipad-pro-11-silver",
    "label": "iPad Pro 11 M4 \u00b7 Silver",
    "width": 1320,
    "height": 940,
    "screen": {
      "x": 55,
      "y": 53,
      "width": 1210,
      "height": 834,
      "radius": 28
    },
    "kind": "tablet",
    "asset": "assets/ipad-pro-11-silver.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6318:14240"
    }
  },
  {
    "id": "ipad-pro-11-space-gray",
    "label": "iPad Pro 11 M4 \u00b7 Space Gray",
    "width": 1320,
    "height": 940,
    "screen": {
      "x": 55,
      "y": 53,
      "width": 1210,
      "height": 834,
      "radius": 28
    },
    "kind": "tablet",
    "asset": "assets/ipad-pro-11-space-gray.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "6316:14230"
    }
  },
  {
    "id": "ipad-mini-starlight",
    "label": "iPad mini \u00b7 Starlight",
    "width": 1275,
    "height": 890,
    "screen": {
      "x": 71,
      "y": 73,
      "width": 1133,
      "height": 744,
      "radius": 28
    },
    "kind": "tablet",
    "asset": "assets/ipad-mini-starlight.png",
    "source": {
      "file": "8azymSnKt4pnYTZqdzQ7tF",
      "node": "5456:18828"
    }
  }
];
export function bezelById(id: string): Bezel | undefined { return BEZELS.find(bezel => bezel.id === id); }
export function screenGeometry(bezel: Bezel, width: number) {
  const scale = width / bezel.width;
  return { scale, width: bezel.screen.width, height: bezel.screen.height,
    left: bezel.screen.x * scale, top: bezel.screen.y * scale };
}
