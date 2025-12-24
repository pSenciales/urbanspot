"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Loading from "@/components/loading/Loading";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
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
    }
  }, [session]);

  if (status === "loading") {
    return <Loading />;
  }

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

      // Upload image if a new file was selected
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
        headers: {
          "Content-Type": "application/json",
        },
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
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-blue-100 mt-2">Gestiona tu información personal</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <Image
                  src={previewUrl || "/default-avatar.png"}
                  alt={formData.name || "Usuario"}
                  width={128}
                  height={128}
                  className={`rounded-full border-4 border-blue-500 shadow-lg ${isEditing ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                    }`}
                  onClick={handleImageClick}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {isEditing && selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tu nombre"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                    {formData.name || "No especificado"}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                  {formData.email || "No especificado"}
                </p>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    El correo electrónico no se puede modificar
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proveedor de Autenticación
                </label>
                <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium capitalize">
                  {session.provider || "No especificado"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isUploadingImage}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? isUploadingImage
                        ? "Subiendo imagen..."
                        : "Guardando..."
                      : "Guardar Cambios"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving || isUploadingImage}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
        {JSON.stringify(session)}
      </div>
    );
  }

  return null;
}
