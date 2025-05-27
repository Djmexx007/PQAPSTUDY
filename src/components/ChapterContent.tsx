import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGame } from './GameState';
import { Book, Star, Trophy, Medal, Brain, Crown, Sparkles, Award, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Chapter } from '../types/chapter';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';
import ChapterProgressBar from './ui/ChapterProgressBar';

interface ChapterContentProps {
  chapter: Chapter;
  onComplete: (score: number, total: number) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({ chapter, onComplete }) => {
  const { addXP, addBadge, addTitle } = useGame();
  const { refreshProfile } = useUserProfile();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState<any[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);

  // Score parfait requis (100%)
  const minimumPassingScore = 1.0;

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => 
    chapter.quiz?.[currentQuestionIndex], 
    [chapter.quiz, currentQuestionIndex]
  );

  // Initialize correctAnswers array when chapter changes
  useEffect(() => {
    if (chapter.quiz) {
      console.log(`Initializing correctAnswers array with length ${chapter.quiz.length}`);
      setCorrectAnswers(new Array(chapter.quiz.length).fill(false));
    }
  }, [chapter.quiz]);

  // Shuffle choices only when the question changes
  useEffect(() => {
    if (chapter.quiz && chapter.quiz[currentQuestionIndex]) {
      const choices = [...chapter.quiz[currentQuestionIndex].choices];
      setShuffledChoices(choices.sort(() => Math.random() - 0.5));
    }
  }, [chapter.quiz, currentQuestionIndex]);

  const handleAnswer = useCallback((index: number) => {
    if (showExplanation || !chapter.quiz) return;

    setSelectedAnswer(index);
    setShowExplanation(true);

    const selected = shuffledChoices[index];
    
    console.log(`Selected answer: ${index}, Correct: ${selected?.correct}`);
    
    if (selected?.correct) {
      // Update correctAnswers array
      const newCorrectAnswers = [...correctAnswers];
      newCorrectAnswers[currentQuestionIndex] = true;
      console.log(`Marking question ${currentQuestionIndex} as correct`);
      console.log('New correctAnswers array:', newCorrectAnswers);
      setCorrectAnswers(newCorrectAnswers);
      
      // Update score
      const newScore = score + 1;
      console.log(`Updating score: ${score} -> ${newScore}`);
      setScore(newScore);
    } else {
      // Mark this question as incorrect
      const newCorrectAnswers = [...correctAnswers];
      newCorrectAnswers[currentQuestionIndex] = false;
      console.log(`Marking question ${currentQuestionIndex} as incorrect`);
      console.log('New correctAnswers array:', newCorrectAnswers);
      setCorrectAnswers(newCorrectAnswers);
    }
  }, [showExplanation, chapter.quiz, shuffledChoices, currentQuestionIndex, correctAnswers, score]);

  const handleNextQuestion = useCallback(() => {
    if (!chapter.quiz) return;

    if (currentQuestionIndex < chapter.quiz.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  }, [currentQuestionIndex, chapter.quiz]);

  const completeQuiz = useCallback(async () => {
    if (quizCompleted) return; // Prevent double completion
    setQuizCompleted(true);
    
    // Calculate final score based on correctAnswers array
    const finalScore = correctAnswers.filter(Boolean).length;
    console.log('Final score calculation:');
    console.log('correctAnswers:', correctAnswers);
    console.log(`finalScore: ${finalScore} out of ${chapter.quiz?.length || 0}`);
    
    // Calculate score percentage
    const scorePercentage = finalScore / (chapter.quiz?.length || 1);
    console.log(`scorePercentage: ${scorePercentage} (${finalScore}/${chapter.quiz?.length || 1})`);
    
    // Check if score meets minimum requirement (100%)
    const passedQuiz = scorePercentage >= minimumPassingScore;
    console.log(`passedQuiz: ${passedQuiz} (${scorePercentage} >= ${minimumPassingScore})`);
    
    // Pass the score to the parent component
    console.log(`Calling onComplete with score: ${finalScore}, total: ${chapter.quiz?.length || 0}`);
    onComplete(finalScore, chapter.quiz?.length || 0);
    
    // Only award XP if the quiz is passed with a perfect score
    if (passedQuiz) {
      if (chapter.boss) {
        const xpEarned = Math.floor((finalScore / (chapter.quiz?.length || 1)) * (chapter.boss.rewards.xp || 0));
        console.log(`Boss chapter passed with perfect score. Earning ${xpEarned} XP`);
        
        if (typeof addXP === 'function') {
          // Update XP in GameState
          addXP(xpEarned);
          
          // Update XP in Supabase
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase
                .from('profiles')
                .select('xp')
                .eq('id', user.id)
                .single();
              
              if (data) {
                const currentXP = data.xp || 0;
                const newXP = currentXP + xpEarned;
                console.log(`Updating XP in Supabase: ${currentXP} -> ${newXP}`);
                
                const { error } = await supabase
                  .from('profiles')
                  .update({ xp: newXP })
                  .eq('id', user.id);
                  
                if (error) {
                  console.error('Error updating XP in Supabase:', error);
                } else {
                  console.log('XP updated successfully in Supabase');
                }
              }
            }
            
            toast.success(`+${xpEarned} XP gagnés !`, {
              icon: '✨',
              style: {
                background: '#10B981',
                color: '#fff'
              }
            });
            
            // Refresh profile to update UI
            refreshProfile();
          } catch (error) {
            console.error('Error updating XP in Supabase:', error);
          }
        }

        // Only award badges and titles for perfect scores
        if (finalScore === chapter.quiz?.length) {
          console.log(`Adding badge: ${chapter.boss.rewards.badge}`);
          if (typeof addBadge === 'function') addBadge(chapter.boss.rewards.badge);
          
          console.log(`Adding title: ${chapter.boss.rewards.title}`);
          if (typeof addTitle === 'function') addTitle(chapter.boss.rewards.title);
        }
      } else if (chapter.minigame?.rewards) {
        const baseXP = chapter.minigame.rewards.xp || 100;
        const xpEarned = Math.floor((finalScore / (chapter.quiz?.length || 1)) * baseXP);
        console.log(`Minigame chapter passed with perfect score. Earning ${xpEarned} XP`);
        
        if (typeof addXP === 'function') {
          // Update XP in GameState
          addXP(xpEarned);
          
          // Update XP in Supabase
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase
                .from('profiles')
                .select('xp')
                .eq('id', user.id)
                .single();
              
              if (data) {
                const currentXP = data.xp || 0;
                const newXP = currentXP + xpEarned;
                console.log(`Updating XP in Supabase: ${currentXP} -> ${newXP}`);
                
                const { error } = await supabase
                  .from('profiles')
                  .update({ xp: newXP })
                  .eq('id', user.id);
                  
                if (error) {
                  console.error('Error updating XP in Supabase:', error);
                } else {
                  console.log('XP updated successfully in Supabase');
                }
              }
            }
            
            toast.success(`+${xpEarned} XP gagnés !`, {
              icon: '✨',
              style: {
                background: '#10B981',
                color: '#fff'
              }
            });
            
            // Refresh profile to update UI
            refreshProfile();
          } catch (error) {
            console.error('Error updating XP in Supabase:', error);
          }
        }

        // Only award badges and titles for perfect scores
        if (finalScore === chapter.quiz?.length) {
          if (chapter.minigame.rewards.badge && typeof addBadge === 'function') {
            console.log(`Adding badge: ${chapter.minigame.rewards.badge}`);
            addBadge(chapter.minigame.rewards.badge);
          }
          if (chapter.minigame.rewards.title && typeof addTitle === 'function') {
            console.log(`Adding title: ${chapter.minigame.rewards.title}`);
            addTitle(chapter.minigame.rewards.title);
          }
        }
      }
    } else {
      // If quiz failed, show failure message
      console.log(`Quiz failed: ${Math.round(scorePercentage * 100)}% < ${Math.round(minimumPassingScore * 100)}%`);
      toast.error(`Score insuffisant (${Math.round(scorePercentage * 100)}%). Score parfait requis: 100%`, {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      });
    }
  }, [chapter, correctAnswers, quizCompleted, addXP, addBadge, addTitle, onComplete, refreshProfile, minimumPassingScore]);

  if (!chapter.quiz || chapter.quiz.length === 0) {
    return (
      <div className="p-4 text-red-400 bg-red-900/20 border border-red-500 rounded-lg">
        Erreur : aucun quiz chargé pour ce chapitre.
      </div>
    );
  }

  // Calculate current score for progress bar
  const currentProgressScore = correctAnswers.filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Résumé du chapitre */}
      <div className="p-6 rounded-xl bg-green-900/10 border border-green-600/30">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-green-400">
          <Book className="w-6 h-6" />
          {chapter.title}
        </h2>
        <p className="whitespace-pre-wrap text-green-200">{chapter.summary}</p>

        {chapter.boss && (
          <div className="mt-6 p-4 rounded-lg bg-red-900/10 border border-red-500/20 text-red-300">
            <div className="flex items-center gap-2 font-bold text-red-400 mb-2">
              <Shield className="w-5 h-5" />
              Boss : {chapter.boss.name}
            </div>
            <p>{chapter.boss.description}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" /> Difficulté : {chapter.boss.difficulty}/5
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" /> XP max : {chapter.boss.rewards.xp}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progression */}
      <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
        <ChapterProgressBar 
          currentScore={currentProgressScore} 
          totalQuestions={chapter.quiz.length} 
          minimumPassingScore={minimumPassingScore} 
        />
        
        <div className="mt-2 text-xs text-green-400/70">
          <p>• Score parfait (100%) requis pour débloquer le boss ou compléter le chapitre</p>
          <p>• Répondez correctement à toutes les questions pour obtenir des récompenses</p>
        </div>
      </div>

      {/* Quiz */}
      {!quizCompleted && currentQuestion && (
        <div className="p-6 rounded-xl bg-black/30 border border-green-500/30">
          <div className="flex justify-between mb-4 text-green-300">
            <h3 className="font-bold flex gap-2 items-center">
              <Brain className="w-5 h-5" />
              Question {currentQuestionIndex + 1} / {chapter.quiz?.length}
            </h3>
            <div className="text-sm opacity-80">Score : {currentProgressScore}</div>
          </div>

          <div className="text-lg font-medium text-green-100 mb-4">{currentQuestion.question}</div>

          <div className="space-y-3">
            {shuffledChoices.map((choice, idx) => {
              const isCorrect = choice.correct;
              const isSelected = selectedAnswer === idx;

              const baseStyle =
                "w-full p-4 rounded-lg text-left transition-all duration-300 border";

              const finalStyle = !showExplanation
                ? `${baseStyle} bg-black/20 border-green-500/20 hover:border-green-400`
                : isCorrect
                ? `${baseStyle} bg-green-500/20 border-green-400 text-green-200`
                : isSelected
                ? `${baseStyle} bg-red-500/20 border-red-500 text-red-200`
                : `${baseStyle} bg-black/10 border-green-800/20 opacity-50`;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={finalStyle}
                  disabled={showExplanation}
                >
                  {choice.text}
                </button>
              );
            })}
          </div>

          {/* Explication */}
          {showExplanation && (
            <>
              <div className="mt-6 bg-green-800/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1 text-yellow-300">
                  <Sparkles className="w-5 h-5" />
                  Explication
                </div>
                <p className="text-green-200">
                  {shuffledChoices.find(c => c.correct)?.explanation}
                </p>
              </div>

              <button
                onClick={handleNextQuestion}
                className="mt-6 w-full p-3 rounded-lg bg-green-600 hover:bg-green-700 transition text-white font-bold flex justify-center gap-2"
              >
                {currentQuestionIndex < chapter.quiz.length - 1 ? 'Question Suivante' : 'Terminer le quiz'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Résultat final */}
      {quizCompleted && (
        <div className="p-6 rounded-xl bg-green-700/10 border border-green-500/30 text-center">
          <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-300 mb-1">Quiz Terminé !</h3>
          <p className="text-green-200 mb-2">
            Score final : {currentProgressScore} / {chapter.quiz?.length} ({Math.round((currentProgressScore / (chapter.quiz?.length || 1)) * 100)}%)
          </p>

          {currentProgressScore === chapter.quiz?.length ? (
            <>
              <div className="p-4 bg-green-500/20 rounded-lg border border-green-500 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-green-300">
                  Félicitations ! Vous avez obtenu un score parfait.
                  {chapter.boss ? " Le boss est maintenant débloqué !" : " Chapitre complété !"}
                </p>
              </div>
              
              {chapter.boss && (
                <div className="mt-4 text-green-400">
                  <p>🏆 Score parfait ! Vous avez débloqué :</p>
                  <ul className="mt-2 space-y-1">
                    <li>🎖️ Badge : {chapter.boss.rewards.badge}</li>
                    <li>📛 Titre : {chapter.boss.rewards.title}</li>
                    <li>✨ XP : {chapter.boss.rewards.xp}</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-500/20 rounded-lg border border-red-500">
              <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-300">
                Score insuffisant. Vous devez obtenir un score parfait (100%) pour continuer.
              </p>
              <button
                onClick={() => {
                  setQuizCompleted(false);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                  setCorrectAnswers(new Array(chapter.quiz?.length || 0).fill(false));
                }}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center gap-2 mx-auto"
              >
                <ArrowRight className="w-4 h-4" />
                Réessayer le quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};