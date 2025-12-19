import { Profile } from "./type";

type AvatarProps = {
  profile: Profile;
};


export const Avatar = ({ profile }: AvatarProps) => (
  <div className="relative w-33 h-28 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-[3px] shadow-md">
    <div className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold ">
      {profile.photoUrl ? (
        <img
          src={profile.photoUrl}
        ></img>
      ) : (
       profile.name.charAt(0)
      )}
    </div>
  </div>
);