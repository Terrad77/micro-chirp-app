interface Chirp {
  id: number | string; // string for optimistic updates
  content: string;
  author_username: string;
  created_at: string;
}

interface ChirpCardProps {
  chirp: Chirp;
}

const ChirpCard: React.FC<ChirpCardProps> = ({ chirp }) => {
  // Formatting the date
  const formattedDate = new Date(chirp.created_at).toLocaleString();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <p className="text-gray-800 text-base mb-2">{chirp.content}</p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Author: <span className="font-semibold">{chirp.author_username}</span>
        </span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
};

export default ChirpCard;
