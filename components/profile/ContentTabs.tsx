
type ContentTabsProps = {

  setActiveTab: (tab: string) => void;
  activeTab: string;
  tabs : {
    label: string;
    key: string;
    items: string[];
  }[];
};
  export const ContentTabs = ({tabs, activeTab, setActiveTab} : ContentTabsProps) => {
    const activeItems = tabs.find((tab) => tab.key === activeTab)?.items || [];
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab.key
                  ? "bg-gray-700 text-white"
                  : "bg-gray-600 text-gray-400"
              }`}
            >
              {tab.label} ({tab.items.length})
            </button>
          ))}
        </div>

        <div className="bg-[#15151E] p-4 rounded-xl shadow-xl">
          {activeItems.length > 0 ? (
            <ul className="space-y-2 list-disc list-inside">
              {activeItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              No {activeTab} to show
            </div>
          )}
        </div>
      </div>
    );
  };