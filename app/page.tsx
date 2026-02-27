'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const teams = [
    { 
      code: 'mi', 
      name: 'Mumbai Indians',
      founded: '2008',
      titles: 5,
      captains: ['Rohit Sharma'],
      homeGround: 'Wankhede Stadium',
      colors: ['#004BA0', '#FFD700'],
      description: 'The most successful franchise in IPL history, Mumbai Indians have dominated the tournament with their powerful batting lineup and strategic gameplay.',
      achievements: [
        { year: '2013', title: 'IPL Champions' },
        { year: '2015', title: 'IPL Champions' },
        { year: '2017', title: 'IPL Champions' },
        { year: '2019', title: 'IPL Champions' },
        { year: '2020', title: 'IPL Champions' }
      ],
      stats: {
        matches: 257,
        wins: 145,
        winRate: 56.4
      },
      legendaryPlayers: ['Sachin Tendulkar', 'Rohit Sharma', 'Jasprit Bumrah', 'Kieron Pollard', 'Lasith Malinga']
    },
    { 
      code: 'csk', 
      name: 'Chennai Super Kings',
      founded: '2008',
      titles: 5,
      captains: ['MS Dhoni'],
      homeGround: 'M.A. Chidambaram Stadium',
      colors: ['#FDB913', '#004BA0'],
      description: 'Known for their consistency and veteran leadership under MS Dhoni, CSK has one of the most loyal fan bases in cricket.',
      achievements: [
        { year: '2010', title: 'IPL Champions' },
        { year: '2011', title: 'IPL Champions' },
        { year: '2018', title: 'IPL Champions' },
        { year: '2021', title: 'IPL Champions' },
        { year: '2023', title: 'IPL Champions' }
      ],
      stats: {
        matches: 241,
        wins: 142,
        winRate: 58.9
      },
      legendaryPlayers: ['MS Dhoni', 'Suresh Raina', 'Ravindra Jadeja', 'Dwayne Bravo', 'Shane Watson']
    },
    { 
      code: 'rcb', 
      name: 'Royal Challengers Bangalore',
      founded: '2008',
      titles: 0,
      captains: ['Virat Kohli', 'Faf du Plessis'],
      homeGround: 'M. Chinnaswamy Stadium',
      colors: ['#C8102E', '#000000'],
      description: 'Despite never winning the title, RCB boasts some of the biggest names in cricket and the most passionate fan following.',
      achievements: [
        { year: '2009', title: 'Runners-up' },
        { year: '2011', title: 'Runners-up' },
        { year: '2016', title: 'Runners-up' }
      ],
      stats: {
        matches: 255,
        wins: 118,
        winRate: 46.3
      },
      legendaryPlayers: ['Virat Kohli', 'AB de Villiers', 'Chris Gayle', 'Rahul Dravid', 'Anil Kumble']
    },
    { 
      code: 'kkr', 
      name: 'Kolkata Knight Riders',
      founded: '2008',
      titles: 2,
      captains: ['Gautam Gambhir', 'Dinesh Karthik', 'Shreyas Iyer'],
      homeGround: 'Eden Gardens',
      colors: ['#3A225D', '#FFD700'],
      description: 'Co-owned by Bollywood superstar Shah Rukh Khan, KKR combines entertainment with cricket excellence.',
      achievements: [
        { year: '2012', title: 'IPL Champions' },
        { year: '2014', title: 'IPL Champions' }
      ],
      stats: {
        matches: 254,
        wins: 129,
        winRate: 50.8
      },
      legendaryPlayers: ['Gautam Gambhir', 'Sunil Narine', 'Andre Russell', 'Jacques Kallis', 'Brendon McCullum']
    },
    { 
      code: 'dc', 
      name: 'Delhi Capitals',
      founded: '2008',
      titles: 0,
      captains: ['Rishabh Pant', 'David Warner'],
      homeGround: 'Arun Jaitley Stadium',
      colors: ['#004BA0', '#DC143C'],
      description: 'Formerly Delhi Daredevils, the rebranded Delhi Capitals represent the young and fearless spirit of Indian cricket.',
      achievements: [
        { year: '2020', title: 'Runners-up' },
        { year: '2021', title: 'Qualifier 1' }
      ],
      stats: {
        matches: 254,
        wins: 118,
        winRate: 46.5
      },
      legendaryPlayers: ['Virender Sehwag', 'Rishabh Pant', 'Shikhar Dhawan', 'David Warner', 'Kagiso Rabada']
    },
    { 
      code: 'srh', 
      name: 'Sunrisers Hyderabad',
      founded: '2013',
      titles: 2,
      captains: ['David Warner', 'Kane Williamson'],
      homeGround: 'Rajiv Gandhi International Stadium',
      colors: ['#FF822A', '#000000'],
      description: 'Known for their strong bowling attack and strategic gameplay, SRH has quickly become a formidable force.',
      achievements: [
        { year: '2016', title: 'IPL Champions' },
        { year: '2018', title: 'Runners-up' }
      ],
      stats: {
        matches: 160,
        wins: 81,
        winRate: 50.6
      },
      legendaryPlayers: ['David Warner', 'Bhuvneshwar Kumar', 'Rashid Khan', 'Kane Williamson', 'Dale Steyn']
    },
    { 
      code: 'rr', 
      name: 'Rajasthan Royals',
      founded: '2008',
      titles: 1,
      captains: ['Shane Warne', 'Sanju Samson'],
      homeGround: 'Sawai Mansingh Stadium',
      colors: ['#254AA5', '#E93A89'],
      description: 'The inaugural IPL champions, RR is known for nurturing young talent and playing fearless cricket.',
      achievements: [
        { year: '2008', title: 'IPL Champions' },
        { year: '2022', title: 'Runners-up' }
      ],
      stats: {
        matches: 215,
        wins: 102,
        winRate: 47.4
      },
      legendaryPlayers: ['Shane Warne', 'Sanju Samson', 'Jos Buttler', 'Yusuf Pathan', 'Ajinkya Rahane']
    },
    { 
      code: 'pbks', 
      name: 'Punjab Kings',
      founded: '2008',
      titles: 0,
      captains: ['KL Rahul', 'Shikhar Dhawan'],
      homeGround: 'Punjab Cricket Association Stadium',
      colors: ['#ED1B24', '#C8A962'],
      description: 'Punjab Kings are known for their aggressive batting and ability to unearth hidden gems in the auction.',
      achievements: [
        { year: '2014', title: 'Runners-up' }
      ],
      stats: {
        matches: 243,
        wins: 110,
        winRate: 45.3
      },
      legendaryPlayers: ['KL Rahul', 'Chris Gayle', 'Yuvraj Singh', 'David Miller', 'Mohammed Shami']
    },
    { 
      code: 'gt', 
      name: 'Gujarat Titans',
      founded: '2022',
      titles: 1,
      captains: ['Hardik Pandya', 'Shubman Gill'],
      homeGround: 'Narendra Modi Stadium',
      colors: ['#1C2340', '#FFB612'],
      description: 'The newest sensation in IPL, GT won the championship in their debut season with exceptional team balance.',
      achievements: [
        { year: '2022', title: 'IPL Champions' },
        { year: '2023', title: 'Runners-up' }
      ],
      stats: {
        matches: 48,
        wins: 32,
        winRate: 66.7
      },
      legendaryPlayers: ['Hardik Pandya', 'Shubman Gill', 'Rashid Khan', 'David Miller', 'Mohammed Shami']
    },
    { 
      code: 'lsg', 
      name: 'Lucknow Super Giants',
      founded: '2022',
      titles: 0,
      captains: ['KL Rahul', 'Nicholas Pooran'],
      homeGround: 'BRSABV Ekana Cricket Stadium',
      colors: ['#00B2FF', '#FFB612'],
      description: 'LSG has quickly established themselves with strong performances and smart acquisitions in the auction.',
      achievements: [
        { year: '2022', title: 'Playoff Qualifier' }
      ],
      stats: {
        matches: 48,
        wins: 24,
        winRate: 50.0
      },
      legendaryPlayers: ['KL Rahul', 'Marcus Stoinis', 'Quinton de Kock', 'Krunal Pandya', 'Avesh Khan']
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating Cricket Balls */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="cricket-ball absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="gradient-orb gradient-orb-3" />

        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid opacity-10" />
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 px-6 py-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-2xl font-bold">🏏</span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-white">
                IPL AUCTION
              </h1>
              <p className="text-xs text-orange-400 font-semibold tracking-widest">SIMULATOR</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-slate-300 font-medium">Season 2025 • Live Simulation</span>
          </div>

          {/* Main Heading */}
          <div className={`space-y-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tighter">
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                BUILD YOUR
              </span>
            </h2>
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tighter text-white">
              DREAM TEAM
            </h2>
          </div>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Experience the thrill of IPL auctions. Strategize, bid, and create your championship-winning squad in the most realistic cricket auction simulator.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full text-lg font-bold text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all flex items-center gap-3">
              Start Auction
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-lg font-semibold text-white hover:bg-white/10 hover:scale-105 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-16 transition-all duration-1000 delay-900 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="stat-card">
              <div className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                10
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-2 font-medium">IPL Teams</div>
            </div>
            <div className="stat-card">
              <div className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                100+
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-2 font-medium">Players</div>
            </div>
            <div className="stat-card">
              <div className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                ₹90Cr
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-2 font-medium">Purse Value</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className={`grid md:grid-cols-3 gap-6 mt-32 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="feature-card group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Bidding</h3>
            <p className="text-slate-400 leading-relaxed">Experience authentic auction dynamics with live bidding wars and strategic decision-making moments.</p>
          </div>

          <div className="feature-card group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Advanced Analytics</h3>
            <p className="text-slate-400 leading-relaxed">Make data-driven decisions with comprehensive player statistics and performance metrics.</p>
          </div>

          <div className="feature-card group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multiplayer Mode</h3>
            <p className="text-slate-400 leading-relaxed">Compete with friends or AI opponents in thrilling multi-franchise auction battles.</p>
          </div>
        </div>

        {/* Team Showcase */}
        <div id="teams" className={`mt-32 transition-all duration-1000 delay-1200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center mb-16">
            <h3 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
              Choose Your Franchise
            </h3>
            <p className="text-xl text-slate-400">Select from iconic IPL teams and build your legacy</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {teams.map((team, index) => (
              <div
                key={team.code}
                className="team-card-logo group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedTeam(team.code)}
              >
                <div className="relative w-full aspect-square flex flex-col items-center justify-center gap-4 p-6">
                  {/* Logo Container with Glow Effect */}
                  <div className="relative w-24 h-24 md:w-28 md:h-28">
                    {/* Glow effect behind logo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-pink-600/30 rounded-full blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100 scale-150" />
                    
                    {/* Logo */}
                    <div className="relative w-full h-full">
                      <Image
                        src={`/logo/${team.code}.png`}
                        alt={`${team.name} Logo`}
                        width={112}
                        height={112}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl filter brightness-100 group-hover:brightness-110"
                      />
                    </div>
                  </div>
                  
                  {/* Team Code */}
                  <div className="text-2xl md:text-3xl font-display font-bold text-white group-hover:text-orange-400 transition-colors tracking-wider">
                    {team.code.toUpperCase()}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Team History Modal */}
      {selectedTeam && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedTeam(null)}
        >
          <div 
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-indigo-950/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const team = teams.find(t => t.code === selectedTeam);
              if (!team) return null;

              return (
                <>
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Header Section */}
                  <div className="relative p-8 md:p-12 border-b border-white/10">
                    {/* Background Glow */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(circle at top left, ${team.colors[0]}, transparent 60%)`
                      }}
                    />
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                      {/* Team Logo */}
                      <div className="relative">
                        <div 
                          className="absolute inset-0 blur-3xl opacity-50"
                          style={{ background: team.colors[0] }}
                        />
                        <Image
                          src={`/logo/${team.code}.png`}
                          alt={team.name}
                          width={150}
                          height={150}
                          className="relative drop-shadow-2xl"
                        />
                      </div>

                      {/* Team Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-5xl md:text-6xl font-display font-bold text-white mb-3">
                          {team.name}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                          <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-semibold text-slate-300">
                            Founded {team.founded}
                          </span>
                          <span 
                            className="px-4 py-1.5 rounded-full text-sm font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})` }}
                          >
                            {team.titles} {team.titles === 1 ? 'Title' : 'Titles'}
                          </span>
                          <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-semibold text-slate-300">
                            {team.homeGround}
                          </span>
                        </div>
                        <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
                          {team.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="p-8 md:p-12">
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                      <div className="stat-modal-card">
                        <div className="text-5xl font-display font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent mb-2">
                          {team.stats.matches}
                        </div>
                        <div className="text-slate-400 font-medium">Matches Played</div>
                      </div>
                      <div className="stat-modal-card">
                        <div className="text-5xl font-display font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                          {team.stats.wins}
                        </div>
                        <div className="text-slate-400 font-medium">Victories</div>
                      </div>
                      <div className="stat-modal-card">
                        <div className="text-5xl font-display font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          {team.stats.winRate}%
                        </div>
                        <div className="text-slate-400 font-medium">Win Rate</div>
                      </div>
                    </div>

                    {/* Win Rate Visualization */}
                    <div className="mb-12">
                      <h3 className="text-2xl font-display font-bold text-white mb-6">Performance Overview</h3>
                      <div className="relative h-8 bg-slate-800/50 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="absolute h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${team.stats.winRate}%`,
                            background: `linear-gradient(90deg, ${team.colors[0]}, ${team.colors[1]})`
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white drop-shadow-lg">
                            {team.stats.wins}W - {team.stats.matches - team.stats.wins}L
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Achievements Timeline */}
                    <div className="mb-12">
                      <h3 className="text-2xl font-display font-bold text-white mb-6">Trophy Cabinet</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.achievements.map((achievement, idx) => (
                          <div 
                            key={idx}
                            className="achievement-card group"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})` }}
                              >
                                🏆
                              </div>
                              <div>
                                <div className="text-lg font-bold text-white">{achievement.year}</div>
                                <div className="text-sm text-slate-400">{achievement.title}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legendary Players */}
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-6">Legendary Players</h3>
                      <div className="flex flex-wrap gap-3">
                        {team.legendaryPlayers.map((player, idx) => (
                          <div 
                            key={idx}
                            className="player-tag"
                            style={{ 
                              animationDelay: `${idx * 0.05}s`,
                              borderColor: team.colors[0]
                            }}
                          >
                            <span className="text-white font-semibold">{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Current Captain */}
                    <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Current Leadership</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {team.captains.join(' • ')}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-slate-400">
            <p className="text-sm">© 2025 IPL Auction Simulator. Experience the ultimate cricket strategy game.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}