const SUPABASE_URL="https://jevbmrsxufqjisflvhnk.supabase.co";
const SUPABASE_KEY="sb_publishable_1ExPrvufP_ViDYOwezzIaQ_Aymqu-n6";

let drivers=[],teams=[],mode="drivers";
const $=id=>document.getElementById(id);

async function get(resource,query){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${resource}?${query}`,{headers:{apikey:SUPABASE_KEY}});
  if(!r.ok) throw new Error(`Supabase request failed: ${r.status}`);
  return r.json();
}
const fmt=(v,d=0)=>v==null?"—":Number(v).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const fullName=d=>`${d.first_name} ${d.last_name}`;

function driverCard(d){
  return `<div class="portrait"><img src="${d.image_url||""}" alt="${fullName(d)}"></div>
  <div class="bio"><b>${fullName(d)}</b><small><span class="num">#${d.driver_number}</span> · ${d.nationality||"—"}<br>${d.team_name||"—"}</small></div>`;
}

const metricDefs=[
  ["Total Points","total_points",0,true],
  ["Wins","wins",0,true],
  ["Podiums","podiums",0,true],
  ["Avg Finish","avg_finish",2,false],
  ["Avg Qualifying","avg_qualifying",2,false],
  ["Net Positions","net_positions_gained",0,true]
];

function renderComparison(){
  const a=drivers.find(d=>String(d.driver_id)===$("driverOne").value);
  const b=drivers.find(d=>String(d.driver_id)===$("driverTwo").value);
  if(!a||!b) return;
  $("cardOne").innerHTML=driverCard(a);
  $("cardTwo").innerHTML=driverCard(b);
  $("metrics").innerHTML=metricDefs.map(([label,key,decimals,higherIsBetter])=>{
    const av=Number(a[key]),bv=Number(b[key]);
    const valid=Number.isFinite(av)&&Number.isFinite(bv)&&av!==bv;
    const aWins=valid&&(higherIsBetter?av>bv:av<bv);
    const bWins=valid&&(higherIsBetter?bv>av:bv<av);
    return `<div class="metric-row">
      <div class="metric-value left ${aWins?"winner":""}">${fmt(a[key],decimals)}</div>
      <div class="metric-label">${label}</div>
      <div class="metric-value ${bWins?"winner":""}">${fmt(b[key],decimals)}</div>
    </div>`;
  }).join("");
  $("compareLoading").hidden=true;
  $("comparison").hidden=false;
}

function populateSelectors(){
  const options=[...drivers].sort((a,b)=>fullName(a).localeCompare(fullName(b)))
    .map(d=>`<option value="${d.driver_id}">${fullName(d)}</option>`).join("");
  $("driverOne").innerHTML=options;
  $("driverTwo").innerHTML=options;
  const norris=drivers.find(d=>d.last_name==="Norris");
  const verstappen=drivers.find(d=>d.last_name==="Verstappen");
  $("driverOne").value=norris?norris.driver_id:drivers[0]?.driver_id;
  $("driverTwo").value=verstappen?verstappen.driver_id:drivers[1]?.driver_id;
  renderComparison();
}

function renderStandings(){
  if(mode==="drivers"){
    $("tableHead").innerHTML="<tr><th>Pos.</th><th>Driver</th><th>Team</th><th class='right'>Points</th><th class='right'>Wins</th><th class='right'>Podiums</th><th class='right'>Avg Finish</th></tr>";
    $("tableBody").innerHTML=drivers.map((d,i)=>`<tr>
      <td class="rank">${i+1}</td>
      <td><div class="person"><img class="mini" src="${d.image_url||""}" alt=""><span>${fullName(d)}</span></div></td>
      <td>${d.team_name||"—"}</td>
      <td class="right"><b>${fmt(d.total_points)}</b></td>
      <td class="right">${fmt(d.wins)}</td>
      <td class="right">${fmt(d.podiums)}</td>
      <td class="right">${fmt(d.avg_finish,2)}</td>
    </tr>`).join("");
  }else{
    $("tableHead").innerHTML="<tr><th>Pos.</th><th>Team</th><th>Country</th><th>Engine</th><th class='right'>Points</th><th class='right'>Wins</th><th class='right'>Podiums</th></tr>";
    $("tableBody").innerHTML=teams.map((t,i)=>`<tr>
      <td class="rank">${i+1}</td><td><b>${t.team_name}</b></td><td>${t.country}</td><td>${t.engine_supplier}</td>
      <td class="right"><b>${fmt(t.total_points)}</b></td><td class="right">${fmt(t.wins)}</td><td class="right">${fmt(t.podiums)}</td>
    </tr>`).join("");
  }
}

async function init(){
  try{
    [drivers,teams]=await Promise.all([
      get("driver_season_stats","select=*&order=total_points.desc,wins.desc,last_name.asc"),
      get("team_season_stats","select=*&order=total_points.desc,wins.desc,team_name.asc")
    ]);
    $("dot").classList.add("ok");
    $("status").textContent="Live Supabase connection";
    $("kDrivers").textContent=drivers.length;
    $("kTeams").textContent=teams.length;
    $("kChampion").textContent=drivers[0]?.last_name||"—";
    populateSelectors();
    renderStandings();
  }catch(error){
    console.error(error);
    $("dot").classList.add("bad");
    $("status").textContent="Connection error";
    $("compareLoading").textContent="Could not load live Supabase data.";
    $("tableBody").innerHTML='<tr><td class="state">Could not load standings from Supabase.</td></tr>';
  }
}

$("driverOne").addEventListener("change",renderComparison);
$("driverTwo").addEventListener("change",renderComparison);
$("driverTab").addEventListener("click",()=>{mode="drivers";$("driverTab").classList.add("active");$("teamTab").classList.remove("active");renderStandings();});
$("teamTab").addEventListener("click",()=>{mode="teams";$("teamTab").classList.add("active");$("driverTab").classList.remove("active");renderStandings();});
init();