import React, { useState, useEffect } from 'react';
import { useGame } from './GameState';
import { Timer, Brain, CheckCircle, XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Question {
  id: number;
  category: 'vie' | 'maladie' | 'fonds' | 'deonto';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExamProps {
  onBack: () => void;
}

// Combine questions from all modules
const examQuestions: Question[] = [
  // --- ASSURANCE VIE (6) ---
  {
    id: 1,
    category: 'vie',
    question: "Quelle conséquence fiscale peut survenir lors du retrait partiel d'une police d'assurance vie universelle financée en excès par rapport au test d'exemption ?",
    options: [
      "Aucune, les retraits sont toujours non imposables",
      "Une partie du retrait peut être imposable si le plafond est dépassé",
      "Le titulaire doit obligatoirement fermer la police",
      "L'assureur refusera le retrait"
    ],
    correctAnswer: 1,
    explanation: "Un retrait excédant la limite du test d'exemption peut entraîner une imposition immédiate sur le gain accumulé."
  },
  {
    id: 2,
    category: 'vie',
    question: "Quel est le principal risque associé à une transformation automatique d'une assurance temporaire en assurance permanente ?",
    options: [
      "Le refus d'émission par l'assureur",
      "La tarification en fonction de la santé actuelle",
      "La hausse importante des primes",
      "La perte de la prestation de décès"
    ],
    correctAnswer: 2,
    explanation: "Les primes sont beaucoup plus élevées en assurance permanente, même si aucune preuve médicale n'est exigée."
  },
  {
    id: 3,
    category: 'vie',
    question: "Quelle combinaison de facteurs est utilisée pour établir le coût d'une police d'assurance vie entière avec participation ?",
    options: [
      "Sexe, lieu de résidence et habitudes de consommation",
      "Coût de mortalité, frais de gestion et rendement des placements",
      "Valeur de rachat, âge de l'assuré et capital assuré",
      "Durée du contrat, clauses d'exclusion et intérêts composés"
    ],
    correctAnswer: 1,
    explanation: "Ces trois composantes sont au cœur du calcul actuariel d'une police avec participation."
  },
  {
    id: 4,
    category: 'vie',
    question: "Pourquoi l'assurance vie temporaire 100 ans peut-elle être considérée comme une alternative à la vie entière ?",
    options: [
      "Elle offre une valeur de rachat immédiate",
      "Elle prévoit une participation aux bénéfices",
      "Elle assure une protection jusqu'à 100 ans avec des primes fixes",
      "Elle est toujours plus avantageuse fiscalement"
    ],
    correctAnswer: 2,
    explanation: "Elle couvre l'assuré jusqu'à 100 ans avec des primes fixes, mais sans valeur de rachat ou participation."
  },
  {
    id: 5,
    category: 'vie',
    question: "Quel type de police conviendrait le mieux pour couvrir un prêt hypothécaire décroissant ?",
    options: [
      "Vie entière avec participation",
      "Temporaire décroissante",
      "Universelle à prime unique",
      "Temporaire croissante"
    ],
    correctAnswer: 1,
    explanation: "La police temporaire décroissante est conçue pour s'aligner avec la diminution d'un solde de prêt."
  },
  {
    id: 6,
    category: 'vie',
    question: "Quel est le principal objectif de la réserve actuarielle dans une police vie entière ?",
    options: [
      "Payer les frais d'administration",
      "Réduire les primes futures",
      "Financer les participations de dividendes",
      "Garantir les prestations futures à l'assuré"
    ],
    correctAnswer: 3,
    explanation: "Elle constitue un fonds accumulé pour assurer le paiement de la prestation de décès future."

  },

  // --- ASSURANCE MALADIE / ACCIDENT (6) ---
  {
    id: 7,
    category: 'maladie',
    question: "Dans quel cas un avenant de remboursement de primes est-il souvent déclenché ?",
    options: [
      "Lors du décès de l'assuré",
      "En cas d'invalidité permanente",
      "Si aucune réclamation n'est faite à l'échéance du contrat",
      "Si la prime est impayée"
    ],
    correctAnswer: 2,
    explanation: "Certains avenants prévoient un remboursement des primes si aucune réclamation n'est faite à la fin du terme."
  },
  {
    id: 8,
    category: 'maladie',
    question: "Quel est le principal rôle du délai de carence dans une assurance invalidité ?",
    options: [
      "Limiter les prestations aux personnes âgées",
      "Diminuer le risque pour l'assureur en excluant les premières semaines",
      "Augmenter la couverture dès le début de l'invalidité",
      "Assurer un revenu maximal à long terme"
    ],
    correctAnswer: 1,
    explanation: "Le délai de carence protège l'assureur contre les invalidités de courte durée."
  },
  {
    id: 9,
    category: 'maladie',
    question: "Quel facteur n'a généralement pas d'impact direct sur la prime d'une assurance maladies graves ?",
    options: [
      "L'âge de l'assuré",
      "Les antécédents familiaux",
      "Le choix du bénéficiaire",
      "Le sexe de l'assuré"
    ],
    correctAnswer: 2,
    explanation: "Le bénéficiaire n'influence pas le risque médical ou la tarification."
  },
  {
    id: 10,
    category: 'maladie',
    question: "Quelle est la principale différence entre une police d'assurance invalidité non résiliable et une à renouvellement garanti ?",
    options: [
      "La durée de couverture",
      "La possibilité de modifier les primes",
      "Le montant des prestations",
      "Le type de prestations imposables"
    ],
    correctAnswer: 1,
    explanation: "La police non résiliable garantit aussi les primes, ce qui n'est pas le cas de celle à renouvellement garanti."
  },
  {
    id: 11,
    category: 'maladie',
    question: "Comment une garantie d'assurabilité future influence-t-elle une police maladie ?",
    options: [
      "Elle bloque toute modification du contrat",
      "Elle permet d'augmenter la couverture sans preuve de santé",
      "Elle empêche toute indexation des primes",
      "Elle impose un examen médical obligatoire chaque année"
    ],
    correctAnswer: 1,
    explanation: "Elle permet d'augmenter la protection au fil du temps, peu importe l'état de santé de l'assuré."
  },
  {
    id: 12,
    category: 'maladie',
    question: "Quel est l'intérêt principal d'ajouter une indexation de prestations à une assurance invalidité ?",
    options: [
      "Réduire les taxes applicables",
      "Offrir un paiement unique à l'assuré",
      "Compenser l'effet de l'inflation sur les prestations",
      "Accélérer le paiement initial"
    ],
    correctAnswer: 2,
    explanation: "L'indexation permet d'ajuster les prestations à l'évolution du coût de la vie, particulièrement en cas d'invalidité prolongée."
  },

  // --- FONDS DISTINCTS (6) ---
  {
    id: 13,
    category: 'fonds',
    question: "Quel est le risque principal d'un contrat de fonds distincts avec garantie à l'échéance, si l'investisseur effectue des retraits partiels ?",
    options: [
      "La garantie augmente proportionnellement",
      "Le contrat est automatiquement fermé",
      "La garantie peut être réduite selon les conditions du contrat",
      "Il n'y a aucun impact"
    ],
    correctAnswer: 2,
    explanation: "Des retraits peuvent réduire proportionnellement la valeur garantie à l'échéance."
  },
  {
    id: 14,
    category: 'fonds',
    question: "Quel est l'avantage fiscal d'un contrat de fonds distincts comparé à un fonds commun de placement ?",
    options: [
      "Exonération complète d'impôt",
      "Report d'impôt sur les gains réalisés",
      "Taux d'imposition réduit garanti",
      "Déduction fiscale sur les cotisations"
    ],
    correctAnswer: 1,
    explanation: "Les fonds distincts permettent un report d'impôt jusqu'au rachat, tout comme les FCP, mais avec la protection successorale en plus."
  },
  {
    id: 15,
    category: 'fonds',
    question: "Quel type de fonds distinct serait le plus approprié pour un client recherchant une croissance à long terme avec tolérance élevée au risque ?",
    options: [
      "Fonds du marché monétaire",
      "Fonds obligataire",
      "Fonds d'actions sectoriel",
      "Fonds de revenu mensuel"
    ],
    correctAnswer: 2,
    explanation: "Les fonds d'actions sectoriels ont un fort potentiel de croissance, mais comportent aussi un risque élevé."
  },
  {
    id: 16,
    category: 'fonds',
    question: "Comment une garantie au décès influence-t-elle la planification successorale ?",
    options: [
      "Elle réduit le besoin de testament notarié",
      "Elle permet un transfert direct au bénéficiaire désigné",
      "Elle empêche la transmission de dettes",
      "Elle annule l'impôt sur les gains"
    ],
    correctAnswer: 1,
    explanation: "Une prestation au décès versée directement au bénéficiaire évite l'homologation."
  },
  {
    id: 17,
    category: 'fonds',
    question: "Quel élément distingue un fonds de revenu garanti (PRMG) d'un fonds traditionnel ?",
    options: [
      "Il est exempt d'impôt à vie",
      "Il garantit un revenu régulier même si la valeur du fonds baisse",
      "Il est disponible seulement aux retraités",
      "Il offre des rendements fixes"
    ],
    correctAnswer: 1,
    explanation: "Un PRMG garantit un revenu même si la valeur marchande diminue."
  },
  {
    id: 18,
    category: 'fonds',
    question: "Quel est le principal inconvénient de la protection contre les créanciers d'un fonds distinct ?",
    options: [
      "Elle est coûteuse",
      "Elle nécessite un bénéficiaire admissible",
      "Elle bloque l'accès aux retraits",
      "Elle est limitée aux revenus de retraite"
    ],
    correctAnswer: 1,
    explanation: "Seule la désignation d'un bénéficiaire admissible permet la protection contre les créanciers."
  },

  // --- DÉONTOLOGIE (7) ---
  {
    id: 19,
    category: 'deonto',
    question: "Un représentant découvre qu'un client a menti dans sa déclaration. Que doit-il faire ?",
    options: [
      "Ignorer la déclaration si elle semble mineure",
      "Informer immédiatement l'assureur",
      "Corriger lui-même l'information",
      "Annuler le contrat sans informer le client"
    ],
    correctAnswer: 1,
    explanation: "Le représentant a l'obligation de déclarer toute information inexacte à l'assureur."
  },
  {
    id: 20,
    category: 'deonto',
    question: "Quel principe déontologique s'applique lors de la recommandation d'un produit inadapté au client ?",
    options: [
      "Intégrité",
      "Conflit d'intérêts",
      "Compétence",
      "Représentation excessive"
    ],
    correctAnswer: 0,
    explanation: "Proposer un produit inadapté contrevient au principe fondamental d'intégrité professionnelle."
  },
  {
    id: 21,
    category: 'deonto',
    question: "Dans quelle situation un représentant peut-il utiliser une désignation de bénéficiaire irrévocable ?",
    options: [
      "Toujours, s'il est le titulaire",
      "Avec l'accord écrit du bénéficiaire",
      "Jamais dans une assurance collective",
      "Uniquement en assurance maladie"
    ],
    correctAnswer: 1,
    explanation: "Une désignation irrévocable ne peut être modifiée sans le consentement du bénéficiaire."
  },
  {
    id: 22,
    category: 'deonto',
    question: "Quel est le rôle du Code de déontologie dans la pratique d'un représentant ?",
    options: [
      "Il sert uniquement à la formation continue",
      "Il encadre la conduite éthique et professionnelle",
      "Il définit les objectifs de vente",
      "Il protège les intérêts de l'assureur"
    ],
    correctAnswer: 1,
    explanation: "Le Code de déontologie fixe les règles éthiques que chaque représentant doit respecter."
  },
  {
    id: 23,
    category: 'deonto',
    question: "Quel document contractuel lie le client et l'assureur en assurance individuelle ?",
    options: [
      "Le formulaire de consentement médical",
      "La proposition d'assurance signée",
      "La carte d'assurance",
      "La note de couverture"
    ],
    correctAnswer: 1,
    explanation: "La proposition signée est l'élément déclencheur de l'acceptation du contrat d'assurance."
  },
  {
    id: 24,
    category: 'deonto',
    question: "Quel type d'infraction est représenté par une omission volontaire de risque par le représentant ?",
    options: [
      "Erreur administrative",
      "Négligence passive",
      "Fausse déclaration",
      "Fautes de compétence"
    ],
    correctAnswer: 2,
    explanation: "Une omission volontaire constitue une fausse déclaration et peut annuler le contrat."
  },
  {
    id: 25,
    category: 'deonto',
    question: "Quel organisme est responsable de la surveillance des pratiques professionnelles au Québec ?",
    options: [
      "AMF",
      "Chambre de l'assurance de dommages",
      "Revenu Québec",
      "OACIQ"
    ],
    correctAnswer: 0,
    explanation: "L'Autorité des marchés financiers supervise les pratiques dans le domaine de l'assurance."
  }
];


export const Exam: React.FC<ExamProps> = ({ onBack }) => {
  const { addXP } = useGame();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [examComplete, setExamComplete] = useState(false);

  // Initialize exam with 35 random questions
  useEffect(() => {
    const shuffled = [...examQuestions].sort(() => Math.random() - 0.5);
   setQuestions(shuffled.slice(0, 25));
    setStartTime(Date.now());
  }, []);

  // Timer
  useEffect(() => {
    if (!examComplete) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, examComplete]);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeExam();
    }
  };

  const completeExam = async () => {
    setExamComplete(true);
    const correctAnswers = selectedAnswers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    const percentage = (correctAnswers / questions.length) * 100;
    
    if (percentage >= 80) {
      const xpAmount = 1000;
      
      // Update XP in GameState
      addXP(xpAmount);
      
      // Update XP in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .single();
        
        if (data) {
          const currentXP = data.xp || 0;
          await supabase
            .from('profiles')
            .update({ xp: currentXP + xpAmount })
            .eq('id', user.id);
        }
      }
    }
    
    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const correctAnswers = selectedAnswers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    const percentage = (correctAnswers / questions.length) * 100;
    const passed = percentage >= 80;

    return (
      <div className="space-y-6">
        <div className="p-6 bg-black/30 rounded-xl border-2 border-green-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Résultats de l'Examen
            </h2>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-900/30 rounded-full">
                Temps: {formatTime(elapsedTime)}
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className={`text-4xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
              {Math.round(percentage)}%
            </div>
            <p className="text-xl">
              {correctAnswers} réponses correctes sur {questions.length}
            </p>
            {passed ? (
              <div className="p-4 bg-green-500/20 rounded-lg border border-green-500">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400">Félicitations ! Vous avez réussi l'examen !</p>
                <p className="text-sm text-green-400/70 mt-2">+1000 XP bonus</p>
              </div>
            ) : (
              <div className="p-4 bg-red-500/20 rounded-lg border border-red-500">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">
                  Vous n'avez pas atteint le seuil de réussite de 80%.
                </p>
                <p className="text-sm text-red-400/70 mt-2">
                  Continuez à étudier et réessayez !
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full p-3 rounded-lg bg-green-500/20 border-2 border-green-500 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au terminal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-black/30 rounded-xl border-2 border-green-500/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Examen PQAP
          </h2>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-green-900/30 rounded-full">
              Question {currentQuestion + 1}/{questions.length}
            </div>
            <div className="px-4 py-2 bg-green-900/30 rounded-full flex items-center gap-2">
              <Timer className="w-4 h-4" />
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
            <p className="text-lg">{questions[currentQuestion]?.question}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {questions[currentQuestion]?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full p-4 rounded-lg text-left transition-all bg-black/30 border-2 border-green-500/30 hover:border-green-500/60"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};