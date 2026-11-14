/* OPJCC 3-Campus shared configuration — additive foundation */
window.OPJCC_CAMPUS_CONFIG = Object.freeze({
  programTypes: {
    short_term: { label: "Short Term Course", campuses: ["punjipathra"] },
    iti: { label: "ITI", campuses: ["angul","patratu"] }
  },
  campuses: {
    punjipathra: {
      id:"punjipathra", name:"Punjipathra Campus", location:"Punjipathra, Raigarh (C.G.)",
      programs:["short_term"],
      trades:["Assistant Electrician","Electrical","Welder","Fitter","Plumber","Digital Mitra (Computer)","Construction Painter","ToT","ToA"],
      publicTrades:["Electrical","Welder","Fitter","Plumbing","Computer Applications"],
      defaultDuration:"4 Months"
    },
    angul: {
      id:"angul", name:"Angul Campus", location:"Angul, Odisha",
      programs:["iti"],
      trades:["Electrician","Fitter","Welder","Plumber","Computer Operator and Programming Assistant (COPA)"],
      durations:{"Electrician":"2 Years","Fitter":"2 Years","Welder":"1 Year","Plumber":"1 Year","Computer Operator and Programming Assistant (COPA)":"1 Year"}
    },
    patratu: {
      id:"patratu", name:"Patratu Campus", location:"Patratu, Ramgarh, Jharkhand",
      programs:["iti"],
      trades:["Electrician","Fitter","Welder (GMAW & GTAW)"],
      durations:{"Electrician":"2 Years","Fitter":"2 Years","Welder (GMAW & GTAW)":"1 Year"}
    }
  },
  normalizeCampus(value){
    const v=String(value||"").trim().toLowerCase();
    return this.campuses[v]?v:"punjipathra";
  },
  campusForLegacy(data){ return this.normalizeCampus(data?.campusId||data?.campus||"punjipathra"); },
  campusOptions(programType){
    const ids=this.programTypes[programType]?.campuses||[];
    return ids.map(id=>this.campuses[id]).filter(Boolean);
  },
  tradeOptions(programType,campusId){
    const c=this.campuses[this.normalizeCampus(campusId)];
    if(!c || !c.programs.includes(programType)) return [];
    return c.trades||[];
  },
  durationFor(campusId,trade){
    const c=this.campuses[this.normalizeCampus(campusId)];
    return c?.durations?.[trade]||c?.defaultDuration||"";
  }
});
