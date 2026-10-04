import React from 'react';
import { City, DamageFloater, GameState, HexCoord, Tile, Unit } from '../types';
import { getHexPolygonPoints, hexToPixel, isSameCoord } from '../utils/hex';
import { Shield, Crosshair, Flag, Mountain, Trees, Sparkles, Building2, Landmark, Zap } from 'lucide-react';

interface HexGridProps {
  state: GameState;
  validMoves: HexCoord[];
  validTargets: HexCoord[];
  damageFloaters: DamageFloater[];
  onSelectCoord: (coord: HexCoord) => void;
}

export const HexGrid: React.FC<HexGridProps> = ({
  state,
  validMoves,
  validTargets,
  damageFloaters,
  onSelectCoord,
}) => {
  const { tiles, units, cities, selectedCoord, playerEra, enemyEra } = state;

  return (
    <div className="w-full flex-1 flex items-center justify-center p-1 sm:p-2 overflow-hidden select-none">
      <div className="relative w-full max-w-[390px] aspect-[380/435] max-h-[62vh] rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Subtle grid background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.15),transparent_70%)] pointer-events-none" />

        <svg
          viewBox="0 0 380 435"
          className="w-full h-full touch-manipulation cursor-pointer"
        >
          {/* Defs for textures and filters */}
          <defs>
            <radialGradient id="playerCityGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="enemyCityGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="resourceGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </radialGradient>
            <filter id="tileShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Render All Hex Tiles */}
          {tiles.map((tile) => {
            const center = hexToPixel(tile.coord);
            const points = getHexPolygonPoints(center);
            const isSelected = isSameCoord(selectedCoord, tile.coord);
            const isValidMove = validMoves.some((m) => isSameCoord(m, tile.coord));
            const isValidTarget = validTargets.some((t) => isSameCoord(t, tile.coord));

            // Terrain Colors
            let fillColor = '#2e5828'; // Plains
            let strokeColor = '#1f3e1b';

            if (tile.terrain === 'MOUNTAIN') {
              fillColor = '#334155'; // Dark slate mountain
              strokeColor = '#1e293b';
            } else if (tile.terrain === 'HILLS') {
              fillColor = '#57534e'; // Stone hills
              strokeColor = '#44403c';
            } else if (tile.terrain === 'FOREST') {
              fillColor = '#14532d'; // Deep forest green
              strokeColor = '#052e16';
            } else if (tile.terrain === 'RESOURCE') {
              fillColor = '#854d0e'; // Golden resource node
              strokeColor = '#a16207';
            }

            // Highlighting override
            if (isValidTarget) {
              fillColor = '#7f1d1d';
              strokeColor = '#ef4444';
            } else if (isValidMove) {
              fillColor = '#064e3b';
              strokeColor = '#10b981';
            } else if (isSelected) {
              strokeColor = '#60a5fa';
            }

            return (
              <g
                key={`tile-${tile.coord.col}-${tile.coord.row}`}
                onClick={() => onSelectCoord(tile.coord)}
                className="transition-all duration-150 group"
              >
                {/* Base Hexagon */}
                <polygon
                  points={points}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : isValidMove || isValidTarget ? 2.5 : 1.5}
                  filter="url(#tileShadow)"
                  className={`${
                    isValidMove ? 'animate-pulse cursor-pointer' : ''
                  } ${isValidTarget ? 'cursor-pointer' : ''}`}
                />

                {/* Terrain Decals / Icons */}
                {tile.terrain === 'MOUNTAIN' && (
                  <g transform={`translate(${center.x - 9}, ${center.y - 12})`} opacity={0.75}>
                    <path
                      d="M9 2 L17 18 L1 18 Z"
                      fill="#64748b"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <path
                      d="M9 2 L12 9 L9 10 L6 9 Z"
                      fill="#e2e8f0"
                    />
                  </g>
                )}

                {tile.terrain === 'FOREST' && (
                  <g transform={`translate(${center.x - 7}, ${center.y - 9})`} opacity={0.65}>
                    <circle cx="7" cy="4" r="5" fill="#22c55e" />
                    <circle cx="3" cy="8" r="4" fill="#16a34a" />
                    <circle cx="11" cy="8" r="4" fill="#15803d" />
                    <rect x="6" y="9" width="2" height="5" fill="#78350f" />
                  </g>
                )}

                {tile.terrain === 'HILLS' && (
                  <g transform={`translate(${center.x - 8}, ${center.y - 6})`} opacity={0.6}>
                    <path
                      d="M0 10 Q 8 0, 16 10"
                      fill="none"
                      stroke="#d6d3d1"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {tile.terrain === 'RESOURCE' && (
                  <g transform={`translate(${center.x - 9}, ${center.y - 9})`}>
                    <circle cx="9" cy="9" r="8" fill="url(#resourceGlow)" />
                    <circle cx="9" cy="9" r="6" fill="#eab308" stroke="#fef08a" strokeWidth="1" />
                    <text
                      x="9"
                      y="12.5"
                      textAnchor="middle"
                      fill="#78350f"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      $
                    </text>
                  </g>
                )}

                {/* Move Hint Indicator */}
                {isValidMove && (
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={5}
                    fill="#34d399"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Attack Target Indicator */}
                {isValidTarget && (
                  <g transform={`translate(${center.x - 10}, ${center.y - 10})`}>
                    <circle cx="10" cy="10" r="9" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
                    <line x1="10" y1="2" x2="10" y2="18" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="2" y1="10" x2="18" y2="10" stroke="#ef4444" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Cities */}
          {cities.map((city) => {
            const center = hexToPixel(city.coord);
            const isPlayer = city.faction === 'PLAYER';
            const era = isPlayer ? playerEra : enemyEra;
            const hpPercent = Math.max(0, city.hp / city.maxHp);

            return (
              <g
                key={`city-${city.id}`}
                transform={`translate(${center.x}, ${center.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCoord(city.coord);
                }}
                className="cursor-pointer"
              >
                {/* City Glow */}
                <circle
                  cx="0"
                  cy="0"
                  r="26"
                  fill={isPlayer ? 'url(#playerCityGlow)' : 'url(#enemyCityGlow)'}
                />

                {/* City Center Base Ring */}
                <circle
                  cx="0"
                  cy="0"
                  r="17"
                  fill={isPlayer ? '#1e3a8a' : '#7f1d1d'}
                  stroke={isPlayer ? '#60a5fa' : '#f87171'}
                  strokeWidth="2"
                />

                {/* City Icon (Ancient Castle vs Modern Metropolis) */}
                {era === 'MODERN' ? (
                  // Modern City High-rise Skyscraper
                  <g transform="translate(-8, -9)">
                    <rect x="2" y="2" width="5" height="15" fill="#cbd5e1" rx="0.5" />
                    <rect x="9" y="5" width="5" height="12" fill="#94a3b8" rx="0.5" />
                    <line x1="4.5" y1="0" x2="4.5" y2="2" stroke="#38bdf8" strokeWidth="1" />
                    <circle cx="4.5" cy="0" r="1" fill="#38bdf8" />
                  </g>
                ) : (
                  // Ancient Castle Stone Fort
                  <g transform="translate(-8, -8)">
                    <path
                      d="M1 14 L1 6 L3 6 L3 8 L6 8 L6 6 L10 6 L10 8 L13 8 L13 6 L15 6 L15 14 Z"
                      fill="#e2e8f0"
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                    <rect x="6.5" y="10" width="3" height="4" fill="#0f172a" rx="1.5" />
                  </g>
                )}

                {/* City Name Label */}
                <rect
                  x="-28"
                  y="18"
                  width="56"
                  height="12"
                  rx="3"
                  fill="#0f172a"
                  fillOpacity="0.9"
                  stroke={isPlayer ? '#3b82f6' : '#ef4444'}
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="27"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="7.5"
                  fontWeight="bold"
                >
                  {city.name.split(' ')[0]}
                </text>

                {/* Building Badges */}
                {city.buildings.length > 0 && (
                  <g transform="translate(-16, -24)">
                    {city.buildings.includes('BARRACKS') && (
                      <g transform="translate(0, 0)">
                        <circle cx="5" cy="5" r="5" fill="#b91c1c" stroke="#fca5a5" strokeWidth="0.8" />
                        <text x="5" y="7.5" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">⚔️</text>
                      </g>
                    )}
                    {city.buildings.includes('RESEARCH_LAB') && (
                      <g transform="translate(18, 0)">
                        <circle cx="5" cy="5" r="5" fill="#0284c7" stroke="#7dd3fc" strokeWidth="0.8" />
                        <text x="5" y="7.5" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">🔬</text>
                      </g>
                    )}
                  </g>
                )}

                {/* City HP Bar */}
                <g transform="translate(-16, -17)">
                  <rect x="0" y="0" width="32" height="3" fill="#334155" rx="1.5" />
                  <rect
                    x="0"
                    y="0"
                    width={32 * hpPercent}
                    height="3"
                    fill={hpPercent > 0.4 ? '#22c55e' : '#ef4444'}
                    rx="1.5"
                  />
                </g>
              </g>
            );
          })}

          {/* Render Units */}
          {units.map((unit) => {
            const center = hexToPixel(unit.coord);
            const isPlayer = unit.faction === 'PLAYER';
            const era = isPlayer ? playerEra : enemyEra;
            const isSelected = isSameCoord(selectedCoord, unit.coord);
            const hpPercent = Math.max(0, unit.hp / unit.maxHp);
            const hasMoves = unit.movesLeft > 0 && !unit.hasAttacked;

            return (
              <g
                key={`unit-${unit.id}`}
                transform={`translate(${center.x}, ${center.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCoord(unit.coord);
                }}
                className="cursor-pointer transition-transform duration-200"
              >
                {/* Selected Unit Ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                  />
                )}

                {/* Unit Shield/Token Base */}
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  fill={isPlayer ? (era === 'MODERN' ? '#0284c7' : '#1d4ed8') : (era === 'MODERN' ? '#b91c1c' : '#b91c1c')}
                  stroke={isPlayer ? '#93c5fd' : '#fca5a5'}
                  strokeWidth="2"
                  filter="url(#tileShadow)"
                />

                {/* Unit Icon Type */}
                {unit.type === 'SETTLER' ? (
                  // Settler: Flag / Tent
                  <g transform="translate(-6, -6)">
                    <path
                      d="M2 12 L2 2 L10 5 L2 8 Z"
                      fill="#fef08a"
                      stroke="#854d0e"
                      strokeWidth="0.8"
                    />
                    <line x1="2" y1="2" x2="2" y2="12" stroke="#fff" strokeWidth="1.5" />
                  </g>
                ) : era === 'MODERN' ? (
                  // Modern Infantry Soldier: Rifle / Helmet
                  <g transform="translate(-6, -6)">
                    <circle cx="6" cy="4" r="3" fill="#e2e8f0" />
                    <rect x="3" y="7" width="6" height="5" fill="#475569" rx="1" />
                    <line x1="1" y1="8" x2="11" y2="4" stroke="#f8fafc" strokeWidth="1.2" />
                    <circle cx="11" cy="4" r="0.8" fill="#38bdf8" />
                  </g>
                ) : (
                  // Ancient Warrior: Crossed Swords
                  <g transform="translate(-6, -6)">
                    <path
                      d="M3 10 L9 2 M9 10 L3 2"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx="6" cy="6" r="1.5" fill="#facc15" />
                  </g>
                )}

                {/* Moves Indicator Dot */}
                {hasMoves && (
                  <circle
                    cx="9"
                    cy="-9"
                    r="3.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="animate-pulse"
                  />
                )}

                {/* Fortified Shield Icon */}
                {unit.isFortified && (
                  <g transform="translate(-13, -13)">
                    <circle cx="4" cy="4" r="4" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" />
                    <text x="4" y="6" textAnchor="middle" fontSize="5" fill="#fff">🛡️</text>
                  </g>
                )}

                {/* HP Bar */}
                <g transform="translate(-12, 14)">
                  <rect x="0" y="0" width="24" height="3" fill="#1e293b" rx="1.5" />
                  <rect
                    x="0"
                    y="0"
                    width={24 * hpPercent}
                    height="3"
                    fill={hpPercent > 0.4 ? '#22c55e' : '#ef4444'}
                    rx="1.5"
                  />
                </g>
              </g>
            );
          })}

          {/* Damage Floaters (Animations) */}
          {damageFloaters.map((df) => {
            const center = hexToPixel(df.coord);
            return (
              <g
                key={df.id}
                transform={`translate(${center.x}, ${center.y - 18})`}
                className="pointer-events-none transition-all duration-700 ease-out animate-bounce"
              >
                <rect
                  x="-20"
                  y="-10"
                  width="40"
                  height="14"
                  rx="4"
                  fill="#0f172a"
                  fillOpacity="0.9"
                  stroke={df.color}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill={df.color}
                  fontSize="8.5"
                  fontWeight="black"
                >
                  {df.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
