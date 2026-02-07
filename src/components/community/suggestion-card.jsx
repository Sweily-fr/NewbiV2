'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, Lightbulb, Bug, CheckIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import {
  VOTE_COMMUNITY_SUGGESTION,
  VALIDATE_COMMUNITY_SUGGESTION,
  UNVALIDATE_COMMUNITY_SUGGESTION
} from '../../graphql/mutations/communitySuggestion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const severityConfig = {
  low: { label: 'Priorité faible', color: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  medium: { label: 'Priorité moyenne', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dotColor: 'bg-yellow-500' },
  high: { label: 'Priorité élevée', color: 'bg-orange-50 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' },
  critical: { label: 'Priorité critique', color: 'bg-red-50 text-red-700 border-red-200', dotColor: 'bg-red-500' }
};

// Mapping des pages
const pageLabels = {
  dashboard: 'Tableau de bord',
  factures: 'Factures',
  devis: 'Devis',
  depenses: 'Dépenses',
  signatures: 'Signatures de mail',
  kanban: 'Gestion de projet',
  transferts: 'Transferts de fichiers',
  clients: 'Clients',
  parametres: 'Paramètres',
  autre: 'Autre'
};

export function SuggestionCard({ suggestion, onUpdate, isValidated = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const [voteSuggestion, { loading: voteLoading }] = useMutation(VOTE_COMMUNITY_SUGGESTION);
  const [validateSuggestion, { loading: validateLoading }] = useMutation(VALIDATE_COMMUNITY_SUGGESTION);
  const [unvalidateSuggestion, { loading: unvalidateLoading }] = useMutation(UNVALIDATE_COMMUNITY_SUGGESTION);

  const handleVote = async (voteType) => {
    try {
      await voteSuggestion({
        variables: { id: suggestion.id, voteType },
        onCompleted: () => {
          onUpdate();
          toast.success('Vote enregistré');
        }
      });
    } catch (error) {
      toast.error('Erreur lors du vote');
      console.error(error);
    }
  };

  const handleValidate = async () => {
    try {
      if (suggestion.userHasValidated) {
        await unvalidateSuggestion({
          variables: { id: suggestion.id },
          onCompleted: () => {
            onUpdate();
            toast.success('Validation retirée');
          }
        });
      } else {
        await validateSuggestion({
          variables: { id: suggestion.id },
          onCompleted: () => {
            onUpdate();
            toast.success('Suggestion validée !');
          }
        });
      }
    } catch (error) {
      toast.error('Erreur lors de la validation');
      console.error(error);
    }
  };

  const TypeIcon = suggestion.type === 'idea' ? Lightbulb : Bug;
  const typeColor = suggestion.type === 'idea' 
    ? 'text-yellow-500' 
    : 'text-red-500';

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* <TypeIcon className={`h-5 w-5 mt-0.5 ${typeColor}`} /> */}
            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-base leading-tight">
                {suggestion.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>
                  {formatDistanceToNow(new Date(suggestion.createdAt), {
                    addSuffix: true,
                    locale: fr
                  })}
                </span>
                {!suggestion.isAnonymous && suggestion.createdByUser && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">
                      {suggestion.createdByUser.name}
                    </span>
                  </>
                )}
                {suggestion.page && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-0">
                      <FileText className="h-3 w-3 mr-1" />
                      {pageLabels[suggestion.page] || suggestion.page}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {suggestion.type === 'bug' && suggestion.severity && (
            <Badge 
              variant="outline" 
              className={`${severityConfig[suggestion.severity].color} px-3 py-1 font-medium`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${severityConfig[suggestion.severity].dotColor}`}></span>
              {severityConfig[suggestion.severity].label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className={`text-sm text-muted-foreground ${!isExpanded && 'line-clamp-2'}`}>
          {suggestion.description}
        </p>
        {suggestion.description.length > 150 && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 mt-1 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}

        {isExpanded && suggestion.stepsToReproduce && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="text-xs font-medium mb-1">Étapes pour reproduire :</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {suggestion.stepsToReproduce}
            </p>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="py-0">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">À ton vote !</p>
            <div className="flex items-center gap-1">
              <Button
                variant={suggestion.userVote === 'upvote' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => handleVote('upvote')}
                disabled={voteLoading || isValidated}
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs font-medium">{suggestion.upvoteCount}</span>
              </Button>

              <Button
                variant={suggestion.userVote === 'downvote' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => handleVote('downvote')}
                disabled={voteLoading || isValidated}
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs font-medium">{suggestion.downvoteCount}</span>
              </Button>

              <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium">{suggestion.netScore > 0 ? '+' : ''}{suggestion.netScore}</span>
              </div>
            </div>
          </div>

          {!isValidated && (
            <div className="flex flex-col gap-2 items-end">
              <p className="text-xs font-medium text-muted-foreground">Ça marche ?</p>
              <Button
                variant={suggestion.userHasValidated ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={handleValidate}
                disabled={validateLoading || unvalidateLoading}
              >
                {suggestion.status === 'validated' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                <span className="text-xs">
                  {suggestion.userHasValidated ? 'Validé' : 'Valider'}
                </span>
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {suggestion.validationCount}
                </Badge>
              </Button>
            </div>
          )}

          {isValidated && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 items-end">
                <p className="text-xs font-medium text-muted-foreground"></p>
                <Badge variant="outline" >
                  <CheckIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                  {suggestion.type === 'bug' ? 'Correctif appliqué' : 'Développement validé'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
