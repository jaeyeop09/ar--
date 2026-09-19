export type ObjectType="wall"|"door"|"window"|"column"|"seismicWall"|"damper"|"furniture";
export interface BuildingObject{id:string;type:ObjectType;x:number;y:number;width:number;depth:number;height:number;rotation:number;thickness?:number}
export interface MissionResult{success:boolean;score:number;reasons:string[]}