import { TerrainType } from "../../../shared/src/enums";

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
    VERTICAL: "vertical",
    HORIZONTAL: "horizontal"
} as const;

export type TileKind = typeof TileKind[keyof typeof TileKind];

export interface TerrainDef {
    type: TerrainType;
    walkable: boolean;
    blocksVision: boolean;
    movementCost: number;
}

export const TerrainRegistry: Record<TerrainType, TerrainDef> = {
    [TerrainType.GRASS]: {
        type: TerrainType.GRASS,
        walkable: true,
        blocksVision: false,
        movementCost: 1
    },
    [TerrainType.DIRT]: {
        type: TerrainType.DIRT,
        walkable: true,
        blocksVision: false,
        movementCost: 1
    },
    [TerrainType.SAND]: {
        type: TerrainType.SAND,
        walkable: true,
        blocksVision: false,
        movementCost: 2
    },
    [TerrainType.CLIFF]: {
        type: TerrainType.CLIFF,
        walkable: false,
        blocksVision: true,
        movementCost: 999
    }
};
