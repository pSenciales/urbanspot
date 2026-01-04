"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";

interface RatingWidgetProps {
    targetType: "POI" | "Image";
    targetId: string;
    poiId?: string;
    currentRating: number;
    totalVotes: number;
    authorId: string;
    onRatingSubmitted?: (newRating: number, newTotal: number) => void;
}

export default function RatingWidget({
    targetType,
    targetId,
    poiId,
    currentRating,
    totalVotes,
    authorId,
    onRatingSubmitted,
}: RatingWidgetProps) {
    const { data: session } = useSession();
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [hasRated, setHasRated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [displayRating, setDisplayRating] = useState(currentRating);
    const [displayTotal, setDisplayTotal] = useState(totalVotes);
    const [error, setError] = useState<string | null>(null);

    const userId = session?.user?.id;
    const isOwnContent = userId === authorId;
    const isAuthenticated = !!session;

    // Check if user has already rated this element
    useEffect(() => {
        // Reset state when target changes
        setHasRated(false);
        setUserRating(null);
        setDisplayRating(currentRating);
        setDisplayTotal(totalVotes);
        setError(null);
        const checkUserRating = async () => {
            if (!userId || !targetId) return;

            try {
                const res = await fetch(
                    `/api/ratings?targetType=${targetType}&targetId=${targetId}&userId=${userId}`
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasRated) {
                        setUserRating(data.userRating);
                        setHasRated(true);
                    }
                    setDisplayRating(data.averageRating);
                    setDisplayTotal(data.totalRatings);
                }
            } catch (err) {
                console.error("Error checking user rating:", err);
            }
        };

        checkUserRating();
    }, [userId, targetId, targetType]);

    const handleRating = async (score: number) => {
        if (!userId || isOwnContent || isSubmitting) return;
        // Skip if trying to submit the same score
        if (hasRated && score === userRating) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const method = hasRated ? "PUT" : "POST";
            const res = await fetch("/api/ratings", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    targetType,
                    targetId,
                    poiId,
                    score,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setUserRating(score);
                setHasRated(true);
                setDisplayRating(data.averageRating);
                setDisplayTotal(data.totalRatings);
                onRatingSubmitted?.(data.averageRating, data.totalRatings);
            } else {
                const errorData = await res.json();
                setError(errorData.error || "Error al valorar");
            }
        } catch (err) {
            console.error("Error submitting rating:", err);
            setError("Error al enviar valoración");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        const displayValue = hoveredStar !== null ? hoveredStar : (userRating ?? displayRating);
        const canClick = isAuthenticated && !isOwnContent && !isSubmitting;

        for (let i = 1; i <= 5; i++) {
            const halfValue = i * 2 - 1; // 1, 3, 5, 7, 9
            const fullValue = i * 2;      // 2, 4, 6, 8, 10

            const isFullFilled = displayValue >= fullValue;
            const isHalfFilled = displayValue >= halfValue && displayValue < fullValue;

            stars.push(
                <div key={i} className="relative w-4 h-4">
                    <div className={`transition-all duration-150 pointer-events-none ${canClick ? "group-hover:scale-110" : ""}`}>
                        <Star className="w-4 h-4 fill-gray-200 text-gray-300 absolute inset-0" />

                        {(isFullFilled || isHalfFilled) && (
                            <Star
                                className="w-4 h-4 fill-yellow-400 text-yellow-400 absolute inset-0"
                                style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        disabled={!canClick}
                        onClick={() => handleRating(halfValue)}
                        onMouseEnter={() => canClick && setHoveredStar(halfValue)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className={`absolute inset-0 w-1/2 z-10 ${canClick ? "cursor-pointer group" : "cursor-default"}`}
                        style={{ clipPath: "inset(0 50% 0 0)" }}
                        title={
                            isOwnContent
                                ? "No puedes valorar tu propio contenido"
                                : `${hasRated ? "Cambiar a" : "Valorar con"} ${halfValue} puntos`
                        }
                    />
                    {/* Right half (even score) */}
                    <button
                        type="button"
                        disabled={!canClick}
                        onClick={() => handleRating(fullValue)}
                        onMouseEnter={() => canClick && setHoveredStar(fullValue)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className={`absolute inset-0 w-1/2 left-1/2 z-10 ${canClick ? "cursor-pointer group" : "cursor-default"}`}
                        style={{ clipPath: "inset(0 0 0 50%)" }}
                        title={
                            isOwnContent
                                ? "No puedes valorar tu propio contenido"
                                : `${hasRated ? "Cambiar a" : "Valorar con"} ${fullValue} puntos`
                        }
                    />
                </div>
            );
        }
        return stars;
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 mx-auto">
                <div className="flex gap-0.5">{renderStars()}</div>
                <span className="text-xs text-gray-600 ml-1">
                    {displayRating.toFixed(1)} ({displayTotal} {displayTotal === 1 ? "voto" : "votos"})
                </span>
            </div>

            {error && <p className="text-xs text-red-500 mx-auto">{error}</p>}

            {!isAuthenticated && (
                <p className="text-xs text-gray-400 mx-auto">Inicia sesión para valorar</p>
            )}

            {isOwnContent && (
                <p className="text-xs text-gray-400 mx-auto">No puedes valorar tu contenido</p>
            )}

            {hasRated && userRating !== null && (
                <div className="flex items-center gap-2 mx-auto">
                    <p className="text-xs text-green-600">
                        Tu valoración: {userRating}/10
                    </p>
                </div>
            )}
        </div>
    );
}
