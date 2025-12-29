
export interface RDFNode {
  id: string;
  label: string;
  type: 'uri' | 'bnode';
  properties: Record<string, string[]>;
  x?: number;
  y?: number;
}

export interface RDFLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: RDFNode[];
  links: RDFLink[];
}
