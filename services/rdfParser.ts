
import * as N3 from 'n3';
import { GraphData, RDFNode, RDFLink } from '../types';

export const parseTurtle = async (turtle: string): Promise<GraphData> => {
  return new Promise((resolve, reject) => {
    const parser = new N3.Parser();
    const nodesMap = new Map<string, RDFNode>();
    const links: RDFLink[] = [];

    const getOrAddNode = (term: any): RDFNode | null => {
      if (term.termType === 'Literal') return null;

      const id = term.value;
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          id,
          label: term.value.split(/[\/#]/).pop() || term.value,
          type: term.termType === 'BlankNode' ? 'bnode' : 'uri',
          properties: {}
        });
      }
      return nodesMap.get(id)!;
    };

    parser.parse(turtle, (error, quad) => {
      if (error) {
        reject(error);
        return;
      }

      if (quad) {
        const subjectNode = getOrAddNode(quad.subject);
        const predicateLabel = quad.predicate.value.split(/[\/#]/).pop() || quad.predicate.value;

        if (quad.object.termType === 'Literal') {
          // Object is a literal: Add as property to subject
          if (subjectNode) {
            if (!subjectNode.properties[predicateLabel]) {
              subjectNode.properties[predicateLabel] = [];
            }
            subjectNode.properties[predicateLabel].push(quad.object.value);
          }
        } else {
          // Object is a resource: Add as link
          const objectNode = getOrAddNode(quad.object);
          if (subjectNode && objectNode) {
            links.push({
              source: subjectNode.id,
              target: objectNode.id,
              label: predicateLabel
            });
          }
        }
      } else {
        // Parsing finished
        resolve({
          nodes: Array.from(nodesMap.values()),
          links
        });
      }
    });
  });
};
