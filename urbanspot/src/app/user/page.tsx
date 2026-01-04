"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Loading from "@/components/loading/Loading";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Camera, Star, Grid, User as UserIcon, Settings, Trophy } from "lucide-react";
import POIGalleryDialog from "@/components/poi/POIGalleryDialog";

interface POI {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  author: {
    _id: string;
    name: string;
    image: string;
  } | string;
  images: {
    url: string;
    metadata: Record<string, string>;
    author?: string;
  }[];
  createdAt: string;
  averageRating?: number;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "contributions">("profile");

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPois, setUserPois] = useState<POI[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingPois, setIsLoadingPois] = useState(true);
  const [userContributions, setUserContributions] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      });
      setPreviewUrl(session.user.image ?? "");
      fetchPois();
      fetchContributions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchPois = async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      const response = await fetch(`/api/pois?userId=${userId}`);
      if (response.ok) {
        const data: POI[] = await response.json();
        setUserPois(data);
      }
    } catch (error) {
      console.error("Error fetching POIs:", error);
    } finally {
      setIsLoadingPois(false);
    }
  };

  // Fetch all images contributed by the user (authorId)
  const fetchContributions = async () => {
    try {
      const response = await fetch(`/api/pois`);
      if (!response.ok) return;
      const allPois: POI[] = await response.json();
      const userId = session?.user?.id;
      if (!userId) return;
      const contributedImages = allPois.flatMap(poi =>
        (poi.images || []).map(img => ({
          ...img,
          poiId: poi._id,
          poiName: poi.name,
          author: img.author || (typeof poi.author === 'string' ? poi.author : poi.author?._id),
        }))
      ).filter(img => img.author === userId);
      setUserContributions(contributedImages);
    } catch (e) {
      console.error('Error fetching contributions', e);
    }
  };

  if (status === "loading") {
    return <Loading />;
  }

  const explorerPoints = session?.user?.points?.explorer || 0;
  const photographerPoints = session?.user?.points?.photographer || 0;
  const totalPoints = explorerPoints + photographerPoints;
  const reputation = session?.user?.reputation || 0;

  const poisCount = userPois.length;
  const photosCount = userPois.reduce((acc, poi) => acc + (poi.images?.length || 0), 0);
  const contributionsCount = userContributions?.length || 0;

  const reputationFromPois = userPois.filter(poi => (poi.averageRating || 0) > 7).length * 10;
  const reputationFromImages = userContributions.filter(img => (img.averageRating || 0) > 7).length * 10;
  const reputationFromRatings = reputationFromPois + reputationFromImages;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
        alert("Por favor selecciona una imagen válida (JPEG, PNG, WEBP, GIF)");
        return;
      }
      if (file.size > 4.5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. El tamaño máximo es 4.5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedFile || !session?.user?.email) return null;
    setIsUploadingImage(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", selectedFile);
      formDataToUpload.append("userId", session.user.email);
      const response = await fetch("/api/image/upload/profile", {
        method: "POST",
        body: formDataToUpload,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error subiendo imagen");
      }
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor intenta de nuevo.");
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let imageUrl = formData.image;
      if (selectedFile) {
        const uploadedUrl = await handleImageUpload();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setIsSaving(false);
          return;
        }
      }
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session?.user?.id,
          name: formData.name,
          image: imageUrl,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error actualizando perfil");
      }
      const updatedUser = await response.json();
      await update({
        ...session,
        user: {
          ...session?.user,
          name: updatedUser.name,
          image: updatedUser.image,
        },
      });
      setFormData({
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      });
      setPreviewUrl(updatedUser.image);
      setSelectedFile(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar el perfil. Por favor intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (session?.user) {
      setFormData({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      });
      setPreviewUrl(session.user.image ?? "");
    }
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (session?.user) {
    const avatarSrc = previewUrl || "/avatar.jpg";
    return (
      <>
        <div className="min-h-full bg-gray-50/50 pb-20">
          {/* Hero Profile Header */}
          <div className="bg-white border-b">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
                  <div className="relative">
                    <Image
                      src={previewUrl || "/default-avatar.png"}
                      alt={formData.name || "Usuario"}
                      width={140}
                      height={140}
                      className={`rounded-full border-4 border-white object-cover h-[140px] w-[140px] ${isEditing ? "cursor-pointer" : ""
                        }`}
                      onClick={handleImageClick}
                    />
                    {isEditing && (
                      <button
                        onClick={handleImageClick}
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors border-4 border-white"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* User Info & Stats */}
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{session.user.name}</h1>
                  <p className="text-gray-500 font-medium">{session.user.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {session.provider || "Usuario"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mt-6 max-w-2xl mx-auto md:mx-0">
                    {/* Points */}
                    <div className="text-center md:text-left">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        {totalPoints}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Puntos Totales</p>
                    </div>
                    {/* Reputation */}
                    <div className="text-center md:text-left border-l border-gray-200 pl-4">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        {reputation}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">
                        Reputación
                        {reputationFromRatings > 0 && (
                          <span className="block text-[10px] text-green-600 normal-case font-normal">
                            (+{reputationFromRatings} por valoraciones)
                          </span>
                        )}
                      </p>
                    </div>
                    {/* POIs */}
                    <div className="text-center md:text-left border-l border-gray-200 pl-4">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        {isLoadingPois ? <Skeleton className="h-6 w-8" /> : poisCount}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">POIs Creados</p>
                    </div>
                    {/* Photos */}
                    <div className="text-center md:text-left border-l border-gray-200 pl-4">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <Camera className="w-5 h-5 text-indigo-500" />
                        {isLoadingPois ? <Skeleton className="h-6 w-8" /> : photosCount}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Fotos Subidas</p>
                    </div>
                    {/* Contributions */}
                    <div className="text-center md:text-left border-l border-gray-200 pl-4">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <Grid className="w-5 h-5 text-green-500" />
                        {contributionsCount}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Contribuciones</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons (Desktop) */}
              <div className="hidden md:block">
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setActiveTab("profile");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 pb-4 px-4 text-sm font-medium transition-all relative ${activeTab === "profile"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <UserIcon className="w-4 h-4" />
                Perfil
                {activeTab === "profile" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("contributions")}
                className={`flex items-center gap-2 pb-4 px-4 text-sm font-medium transition-all relative ${activeTab === "contributions"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Grid className="w-4 h-4" />
                Contribuciones
                {activeTab === "contributions" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "profile" ? (
                <div className="max-w-2xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Información Personal</h2>
                  <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-lg">
                          {formData.name || "No especificado"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-lg">
                        {formData.email || "No especificado"}
                      </p>
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSave}
                          disabled={isSaving || isUploadingImage}
                          className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          {isSaving ? (isUploadingImage ? "Subiendo..." : "Guardando...") : "Guardar Cambios"}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="md:hidden w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Editar Información
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* POIs Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      Mis Puntos de Interés
                    </h3>
                    {userPois.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userPois.map((poi) => (
                          <Card key={poi._id} className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-md">
                            <div className="relative h-48 w-full">
                              <Image
                                src={poi.images?.[0]?.url || "/mapa_fondo.jpg"}
                                alt={poi.name}
                                fill
                                className="object-cover transition-transform duration-500"
                              />
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-900">
                                {poi.category}
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-bold text-gray-900 truncate">{poi.name}</h4>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{poi.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                          <MapPin className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No has creado ningún punto de interés</h3>
                        <p className="mt-1 text-sm text-gray-500">¡Explora el mapa y comparte tus lugares favoritos!</p>
                      </div>
                    )}
                  </div>

                  {/* Photos Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-500" />
                      Mis Fotos ({contributionsCount})
                    </h3>
                    {contributionsCount > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userContributions.map((img, idx) => (
                          <div key={`${img.url}-${idx}`} className="relative aspect-square rounded-lg group cursor-pointer" onClick={() => {
                            setCurrentImageIndex(idx);
                            setIsGalleryOpen(true);
                          }}>
                            <Image
                              src={img.url}
                              alt="Contribución"
                              fill
                              className="object-cover group-hover:opacity-90 transition-opacity cursor-zoom-in"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-4">
                          <Camera className="w-6 h-6 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No hay fotos para mostrar</h3>
                        <p className="mt-1 text-sm text-gray-500">Las fotos que subas a los POIs aparecerán aquí.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div >
        {isGalleryOpen && (
          <POIGalleryDialog
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            images={userContributions}
            poiName="Galería"
            poiAuthorId={session.user.id}
            initialIndex={currentImageIndex}
          />
        )}
      </>
    );
  }

  return null;
}
