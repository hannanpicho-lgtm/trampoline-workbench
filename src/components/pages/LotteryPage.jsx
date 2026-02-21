import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, DollarSign, Gift } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function LotteryPage({ currentUser, onNavigate }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [winHistory, setWinHistory] = useState([]);

  const prizes = [
    { label: "$0.50", value: 0.5, color: "bg-red-500" },
    { label: "$1", value: 1, color: "bg-blue-500" },
    { label: "$0.25", value: 0.25, color: "bg-green-500" },
    { label: "$5", value: 5, color: "bg-purple-500" },
    { label: "$0.75", value: 0.75, color: "bg-orange-500" },
    { label: "$2", value: 2, color: "bg-pink-500" },
    { label: "$0.50", value: 0.5, color: "bg-yellow-500" },
    { label: "$10", value: 10, color: "bg-indigo-500" },
  ];

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0) return;

    setSpinning(true);
    
    // Random spin duration and final position
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + (spins * 360);
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prizeAngle = (360 / prizes.length) * prizeIndex;
    const finalAngle = finalRotation + (360 - prizeAngle);

    setRotation(finalAngle);

    setTimeout(async () => {
      const prize = prizes[prizeIndex];
      
      try {
        const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
        if (appUserData.length > 0) {
          const newBalance = (appUserData[0].balance || 0) + prize.value;
          await base44.entities.AppUser.update(appUserData[0].id, { balance: newBalance });

          await base44.entities.Transaction.create({
            userId: appUserData[0].id,
            type: "bonus",
            amount: prize.value,
            status: "completed",
            balanceBefore: appUserData[0].balance,
            balanceAfter: newBalance
          });

          setWinHistory(prev => [{ prize: prize.label, time: new Date() }, ...prev.slice(0, 4)]);
          setSpinsLeft(prev => prev - 1);
          
          toast.success(`You won ${prize.label}!`, { 
            description: "Prize added to your balance" 
          });
        }
      } catch (error) {
        toast.error("Failed to process prize");
      }

      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Lucky Lottery</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 pb-8">
        {/* Info Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm opacity-90">Spins Remaining</div>
              <div className="text-4xl font-bold">{spinsLeft}</div>
            </div>
            <Sparkles className="w-12 h-12 opacity-80" />
          </div>
          <div className="text-xs opacity-90">
            Complete tasks to earn more spins! Each spin guarantees a prize.
          </div>
        </div>

        {/* Wheel Container */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg">
          <div className="relative w-full aspect-square max-w-sm mx-auto">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600" />
            </div>

            {/* Wheel */}
            <div
              className="w-full h-full rounded-full relative overflow-hidden shadow-2xl border-8 border-gray-200"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none"
              }}
            >
              {prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index;
                return (
                  <div
                    key={index}
                    className={`absolute w-1/2 h-1/2 origin-bottom-right ${prize.color}`}
                    style={{
                      transform: `rotate(${angle}deg) skewY(${90 - 360 / prizes.length}deg)`,
                      left: "50%",
                      top: "50%"
                    }}
                  >
                    <div
                      className="absolute top-4 left-4 text-white font-bold text-sm"
                      style={{
                        transform: `skewY(${360 / prizes.length - 90}deg) rotate(${180 / prizes.length}deg)`
                      }}
                    >
                      {prize.label}
                    </div>
                  </div>
                );
              })}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-300">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || spinsLeft <= 0}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? "Spinning..." : spinsLeft <= 0 ? "No Spins Left" : "SPIN NOW!"}
          </button>
        </div>

        {/* Win History */}
        {winHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Recent Wins
            </h3>
            <div className="space-y-3">
              {winHistory.map((win, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{win.prize}</div>
                      <div className="text-xs text-gray-500">
                        {win.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold">Won!</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}