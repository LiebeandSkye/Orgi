import React from "react"; 
import { ScoreRing } from "./ScoreRing"; 

export function DetailScoreRings({ 
  providerRating, 
  providerVotes, 
  communityScore = null, 
  communityVotesCount = 0, 
  fallbackCommunityRating = null, 
  fallbackCommunityVotes = "—", 
  blendedScore: explicitBlended, 
  totalVotesLabel: explicitTotalLabel, 
  communityVotesLabel: explicitCommunityLabel, 
}) { 
  const providerNum = parseFloat(providerRating) || 0; 
  const providerCount = 
    typeof providerVotes === "string" && (providerVotes.includes("K") || providerVotes.includes("k")) 
      ? parseFloat(providerVotes) * 1000 
      : parseInt(providerVotes, 10) || 100; 

  let blendedScore = explicitBlended ?? providerNum; 
  let totalVotesLabel = explicitTotalLabel ?? providerVotes; 

  if (explicitBlended === undefined && communityScore !== null && communityVotesCount > 0) { 
    blendedScore = Number( 
      ( 
        (providerNum * providerCount + communityScore * communityVotesCount) / 
        (providerCount + communityVotesCount) 
      ).toFixed(1) 
    ); 
    const totalCount = providerCount + communityVotesCount; 
    totalVotesLabel = totalCount >= 1000 
      ? `${(totalCount / 1000).toFixed(1)}k ratings` 
      : `${totalCount} ratings`; 
  } 

  const effectiveCommunityScore = communityScore !== null ? communityScore : fallbackCommunityRating; 
  const effectiveCommunityLabel = 
    explicitCommunityLabel ?? 
    (communityVotesCount > 0 ? `${communityVotesCount} Orgi votes` : fallbackCommunityVotes); 

  return ( 
    <div className="flex items-center gap-8 mb-8"> 
      <ScoreRing 
        score={blendedScore} 
        label={totalVotesLabel} 
        size="lg" 
      /> 
      
      <div className="w-[1px] h-12 bg-[#1C1C1C]" /> 
      
      <ScoreRing 
        score={effectiveCommunityScore} 
        label={effectiveCommunityLabel} 
        size="sm" 
        variant="inline" 
      /> 
    </div> 
  ); 
} 
