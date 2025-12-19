import { Profile } from "./type";

type InterestProps = {
  profile: Profile;
};
export const InterestsSection = ({profile} : InterestProps) => (
    <div className="bg-background p-4 rounded-xl shadow-xl">
      <h3 className="font-semibold text-gray-300 mb-2">INTERESTS AND HOBBIES</h3>
      <div className="flex flex-wrap gap-2">
        {(profile.interests_hobby ?? []).map((item, index) => (
          <span
            key={index}
            className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );