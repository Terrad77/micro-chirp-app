import { useState } from "react";

interface NewChirpFormProps {
  onSubmit: (content: string) => void;
  isPending: boolean;
}

const NewChirpForm: React.FC<NewChirpFormProps> = ({ onSubmit, isPending }) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent(""); // Clear the field after submission
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md mb-8 text-indigo-900"
    >
      <h2 className="text-xl font-bold mb-4 ">Write a new chirp</h2>
      <textarea
        className="w-full  p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        disabled={isPending}
      />
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isPending}
        >
          {isPending ? "Sending..." : "Publish Chirp"}
        </button>
      </div>
    </form>
  );
};

export default NewChirpForm;
