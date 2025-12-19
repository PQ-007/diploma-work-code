import { FaCalendarAlt } from "react-icons/fa";
import { Profile } from "./type";

type BioProps = {
  profile: Profile;
};

export const BioSection = ({ profile }: BioProps) => (
  <div className="p-4 rounded-xl shadow-xl">
    <h2 className="font-semibold mb-2">BIO</h2>
    <div className="flex items-center gap-2 mb-2"></div>
    <p className="text-sm">{profile.bio}</p>
    <p className="text-sm mt-3">
      <FaCalendarAlt className="inline mr-2" />
      Joined {profile.joinedDate?.slice(0, 10)}
    </p>
  </div>
);