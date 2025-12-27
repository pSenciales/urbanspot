import Link from "next/link";
////===========================MONGODB====================
// import dbConnect from "@/lib/mongo";
// import User from "@/models/User";

//==================MYSQL==============================
import {prisma} from "@/lib/prisma";


import { Button } from "@/components/ui/button"; 
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getLeaderboard(page: number, order: string) {
  ////===========================MONGODB====================
  //await dbConnect();

  //=====================MYSQL=============================
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Cogemos todos los usuarios aún sin ordenar
  const users = await prisma.user.findMany({
    skip,
    take: ITEMS_PER_PAGE,
    select: {
      id: true,
      name: true,
      image: true,
      pointsExplorer: true,
      pointsPhotographer: true,
    },
  });

  // A cada usuario, le agregamos el campo totalPoints
  const usersWithTotal = users.map(user => ({
      ...user,
      totalPoints: (user.pointsExplorer ?? 0) + (user.pointsPhotographer ?? 0),
    }));

  // Ordenamos o por puntos totales, o por explorador o por fotógrafo
  if( order === "explorer"){
    usersWithTotal.sort((a,b) => (b.pointsExplorer ?? 0) - (a.pointsExplorer ?? 0) );
  }else if (order === "photographer"){
    usersWithTotal.sort((a,b) => (b.pointsPhotographer ?? 0) - (a.pointsPhotographer ?? 0) );
  }else{
    usersWithTotal.sort((a,b) => b.totalPoints - a.totalPoints); 
  }

  // Obtenemos total de usuarios 
  const totalUsers = await prisma.user.count();

  // Cambiamos el formato de la salida?
  const cleanUsers = usersWithTotal.map( user => ({
    id: user.id.toString(),
    name: user.name || "Usuario Anónimo",
    image: user.image,
    puntos_explorador: user.pointsExplorer || 0,
    puntos_fotografo: user.pointsPhotographer || 0,
    total: user.totalPoints
  }));
  
  ////===========================MONGODB====================
  // let sortStage: any = { totalPoints: -1 }; 
  // if (order === "explorer") {
  //   sortStage = { "points.explorer": -1 };
  // }
  // if (order === "photographer") {
  //   sortStage = { "points.photographer": -1 };
  // }

  // const users = await User.aggregate([
  // {
  //     $addFields: {
  //     totalPoints: {
  //         $add: [
  //         { $ifNull: ["$points.explorer", 0] },
  //         { $ifNull: ["$points.photographer", 0] }
  //         ]
  //     }
  //     }
  // },
  // { $sort: sortStage },
  // { $skip: skip },
  // { $limit: ITEMS_PER_PAGE }
  // ]);
  // const totalUsers = await User.countDocuments();
  // const cleanUsers = users.map((user: any) => ({
  //   _id: user._id.toString(),
  //   name: user.name || "Usuario Anónimo",
  //   image: user.image,
  //   puntos_explorador: user.points?.explorer || 0,
  //   puntos_fotografo: user.points?.photographer || 0,
  //   total: user.totalPoints || 0
  // }));

  return { users: cleanUsers, totalUsers };
}

export default async function ClasificacionPage({ searchParams }: Props) {
  const params = await searchParams;
  
  const page = Number(params.page) || 1;

  const order = (params.order as string) || "total";

  const { users, totalUsers } = await getLeaderboard(page, order);

  const emptyRowsCount = ITEMS_PER_PAGE - users.length;
  const emptyRows = Array.from({ length: Math.max(0, emptyRowsCount) });

  const totalPages = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE));

  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const startingRank = (page - 1) * ITEMS_PER_PAGE;

  const activeBtnClass = "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white border-indigo-600";
  const inactiveBtnClass = "bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200";

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center p-4">
      
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/mapa_fondo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-white/20 flex flex-col max-h-[85vh]">
        
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-8 text-center text-white rounded-t-2xl flex-none">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Salón de la Fama
          </h1>
          <p className="text-indigo-100 text-lg font-light">
            Los exploradores con más puntos de UrbanSpot
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-gray-600 font-medium">Ordenar por:</span>

            <Link href={`/clasificacion?page=1&order=total`}>
                <Button 
                    variant="outline" 
                    className={order === "total" ? activeBtnClass : inactiveBtnClass}
                >
                ⭐ Total
                </Button>
            </Link>

            <Link href={`/clasificacion?page=1&order=explorer`}>
                                <Button 
                    variant="outline" 
                    className={order === "explorer" ? activeBtnClass : inactiveBtnClass}
                >
                🗺️ P.O.I.
                </Button>
            </Link>

            <Link href={`/clasificacion?page=1&order=photographer`}>
                                <Button 
                    variant="outline" 
                    className={order === "photographer" ? activeBtnClass : inactiveBtnClass}
                >
                📸 Fotos
                </Button>
            </Link>
        </div>
        <div className="p-6 flex flex-col min-h-0 flex-1"> 
            <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 scrollbar-custom">
                <table className="min-w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider text-left">
                    <th className="py-4 px-6 w-20">#Nº</th>
                    <th className="py-4 px-6">Explorador</th>
                    <th className="py-4 px-6 text-center w-24">🗺️ P.O.I.</th>
                    <th className="py-4 px-6 text-center w-24">📸 Fotos</th>
                    <th className="py-4 px-6 text-center w-24">⭐ Total</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: any, index: number) => {
                    const currentRank = startingRank + index + 1;
                    
                    let rankDisplay = <span className="font-bold text-gray-500">#{currentRank}</span>;
                    if (page === 1) {
                        if (index === 0) rankDisplay = <span className="text-2xl drop-shadow-sm">🥇</span>;
                        if (index === 1) rankDisplay = <span className="text-2xl drop-shadow-sm">🥈</span>;
                        if (index === 2) rankDisplay = <span className="text-2xl drop-shadow-sm">🥉</span>;
                    }

                    return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-indigo-50/50 transition-colors">
                        <td className="py-3 px-6 whitespace-nowrap">
                            {rankDisplay}
                        </td>
                        <td className="py-3 px-6">
                            <div className="flex items-center">
                            {user.image ? (
                                <img className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm object-cover" src={user.image} alt={user.name} />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 mr-3 flex items-center justify-center text-white font-bold shadow-sm">
                                {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-xs">{user.name}</span>
                            </div>
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-blue-600 bg-blue-50/30 rounded-lg">
                            {user.puntos_explorador}
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-green-600 bg-green-50/30 rounded-lg">
                            {user.puntos_fotografo}
                        </td>
                        <td className="py-3 px-6 text-center font-bold text-indigo-700 text-lg">
                            {user.total}
                        </td>
                        </tr>
                    );
                    })}

                    {emptyRows.map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-gray-50 bg-gray-50/30">
                        <td className="py-4 px-6 text-center text-gray-300">-</td>
                        <td className="py-4 px-6 text-gray-300 italic">Espacio disponible</td>
                        <td className="py-4 px-6 text-center text-gray-300">-</td>
                        <td className="py-4 px-6 text-center text-gray-300">-</td>
                        <td className="py-4 px-6 text-center text-gray-300">-</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            <div className="flex-none flex justify-between items-center mt-4 pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                    {hasPrevPage ? (
                    <Link href={`/clasificacion?page=${page - 1}&order=${order}`} passHref>
                        <Button variant="outline" className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" /> Anterior
                        </Button>
                    </Link>
                    ) : (
                    <Button variant="outline" disabled className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    )}

                    {hasNextPage ? (
                    <Link href={`/clasificacion?page=${page + 1}&order=${order}`} passHref>
                        <Button variant="outline" className="flex items-center gap-1">
                        Siguiente <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    ) : (
                    <Button variant="outline" disabled className="flex items-center gap-1">
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                    )}

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}