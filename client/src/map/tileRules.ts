export const TileKind = {
    ISOLATED: "isolated",
    FULL: "full",
    EDGE_N: "edge_n",
    EDGE_E: "edge_e",
    EDGE_S: "edge_s",
    EDGE_W: "edge_w",
    CORNER_NE: "corner_ne",
    CORNER_NW: "corner_nw",
    CORNER_SE: "corner_se",
    CORNER_SW: "corner_sw",
    INNER_NE: "inner_ne",
    INNER_NW: "inner_nw",
    INNER_SE: "inner_se",
    INNER_SW: "inner_sw",
    T_N: "t_n",
    T_E: "t_e",
    T_S: "t_s",
    T_W: "t_w",
    // Straight variants are not strictly part of 4-bit mask but can be used if needed
    VERTICAL: "vertical",
    HORIZONTAL: "horizontal"
} as const;

export type TileKind = typeof TileKind[keyof typeof TileKind];

// Map 4-bit mask (0-15) to TileKind
// N=1, E=2, S=4, W=8
export const MASK_TO_KIND: Record<number, TileKind> = {
    0: TileKind.ISOLATED,
    1: TileKind.EDGE_N,   // Only North neighbor -> It's an end piece pointing North? Wait. 
    // Standard Blob: 
    // If neighbor is NORTH, I connect to North. So I am NOT an edge_n (which usually means North Edge of the island).
    // Re-reading User Spec:
    // Mask 1 (North) -> Tile "edge_n"
    // Mask 2 (East) -> Tile "edge_e"
    // This implies "edge_n" means "Connection to North". 
    // Let's stick strictly to User Spec:
    // 1 -> edge_n
    // 2 -> edge_e
    // 4 -> edge_s
    // 8 -> edge_w

    2: TileKind.EDGE_E,
    3: TileKind.CORNER_NE, // N + E
    4: TileKind.EDGE_S,
    5: TileKind.VERTICAL,  // N + S (User spec didn't list this explicitly for 4-bit, but 1+4=5. User text: "15=all, 7=t_w...". 
    // User didn't specify 5 or 10. 
    // Standard: 5 is usually vertical, 10 is horizontal.
    // Let's us TileKind.VERTICAL for 5 and HORIZONTAL for 10 if allowed, or fallback to something safe.
    // User spec: "Mask -> Tile Mapping" table only listed specific ones. 
    // 5 (N+S) isn't in the table. 
    // Default to FULL or specific straight?
    // User folder structure has "straight". 
    // Let's assume 5 -> Vertical, 10 -> Horizontal.

    6: TileKind.CORNER_SE, // E + S
    7: TileKind.T_W,       // N+E+S (Missing W) -> T_W
    8: TileKind.EDGE_W,
    9: TileKind.CORNER_NW, // N + W
    10: TileKind.HORIZONTAL, // E + W (2+8=10)
    11: TileKind.T_S,      // N+E+W (Missing S) -> T_S
    12: TileKind.CORNER_SW, // S + W
    13: TileKind.T_E,      // N+S+W (Missing E) -> T_E
    14: TileKind.T_N,      // E+S+W (Missing N) -> T_N
    15: TileKind.FULL
};
