
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData, RDFNode } from '../types';

interface Props {
  data: GraphData;
  onNodeSelect: (node: RDFNode | null) => void;
  selectedNodeId?: string | null;
}

const GraphVisualizer: React.FC<Props> = ({ data, onNodeSelect, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);
  const containerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);

    if (!containerRef.current) {
      const g = svg.append("g");
      // @ts-ignore
      containerRef.current = g.node();

      zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoomRef.current);

      svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .append("svg:path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", "#cbd5e1");
    }

    const g = d3.select(containerRef.current);
    const validLinks = data.links.filter(l => 
      data.nodes.some(n => n.id === (typeof l.source === 'string' ? l.source : (l.source as any).id)) && 
      data.nodes.some(n => n.id === (typeof l.target === 'string' ? l.target : (l.target as any).id))
    );

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<any>()
        .force("link", d3.forceLink<any, any>().id(d => d.id).distance(180))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(80));
    }

    const simulation = simulationRef.current;
    simulation.nodes(data.nodes);
    simulation.force("link").links(validLinks);
    simulation.alpha(0.2).restart();

    const link = g.selectAll<SVGLineElement, any>(".link")
      .data(validLinks, d => `${(d.source.id || d.source)}-${(d.target.id || d.target)}-${d.label}`)
      .join("line")
      .attr("class", "link")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const linkText = g.selectAll<SVGTextElement, any>(".link-text")
      .data(validLinks, d => `${(d.source.id || d.source)}-${(d.target.id || d.target)}-${d.label}`)
      .join("text")
      .attr("class", "link-text")
      .attr("font-size", "9px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .text(d => d.label);

    const node = g.selectAll<SVGGElement, any>(".node-group")
      .data(data.nodes, d => d.id)
      .join(
        enter => {
          const group = enter.append("g")
            .attr("class", "node-group")
            .on("click", (event, d) => {
              event.stopPropagation();
              onNodeSelect(d);
            })
            .call(d3.drag<any, any>()
              .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.2).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
              })
              .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              })
            );

          group.append("circle")
            .attr("class", "node-bg")
            .attr("r", 18)
            .attr("fill", "#fff")
            .attr("stroke", d => d.type === 'uri' ? "#3b82f6" : "#94a3b8")
            .attr("stroke-width", 2);

          group.append("text")
            .attr("class", "node-label")
            .attr("dy", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .attr("fill", "#334155")
            .text(d => d.label);

          return group;
        }
      );

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      linkText
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

  }, [data]);

  // Handle external selection (highlighting)
  useEffect(() => {
    if (!containerRef.current || !data) return;
    const g = d3.select(containerRef.current);
    
    // Reset all nodes
    g.selectAll(".node-bg")
      .transition().duration(200)
      .attr("stroke-width", 2)
      .attr("r", 18);

    if (selectedNodeId) {
      const targetNode = data.nodes.find(n => n.id === selectedNodeId);
      if (targetNode && svgRef.current && zoomRef.current) {
        // Highlight
        g.selectAll(".node-group")
          .filter((d: any) => d.id === selectedNodeId)
          .select(".node-bg")
          .transition().duration(500)
          .attr("stroke-width", 5)
          .attr("r", 22);

        // Center view on node
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        d3.select(svgRef.current).transition().duration(750).call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(1.2).translate(-(targetNode.x || 0), -(targetNode.y || 0))
        );
      }
    }
  }, [selectedNodeId, data]);

  return <div className="w-full h-full relative"><svg ref={svgRef} className="w-full h-full" /></div>;
};

export default GraphVisualizer;
