import { Feather, Ionicons } from "@expo/vector-icons";
import { BottomTabBarButtonProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import HomeScreen from "@/screens/HomeScreen";
import MatchScreen from "@/screens/MatchScreen";
import ResumeScreen from "@/screens/ResumeScreen";
import ConnectScreen from "@/screens/ConnectScreen";
import AdvisorScreen from "@/screens/AdvisorScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator();

type IconRenderer = (active: boolean) => React.ReactNode;

const ICONS: Record<string, { label: string; render: IconRenderer }> = {
  Home: { label: "Home", render: (a) => <Feather name="home" size={20} color={a ? colors.gold : colors.mut} /> },
  Match: { label: "Match", render: (a) => <Ionicons name="briefcase-outline" size={20} color={a ? colors.gold : colors.mut} /> },
  Resume: { label: "Resume", render: (a) => <Feather name="file-text" size={20} color={a ? colors.gold : colors.mut} /> },
  Connect: { label: "Connect", render: (a) => <Feather name="users" size={20} color={a ? colors.gold : colors.mut} /> },
  Advisor: { label: "Advisor", render: (a) => <Ionicons name="sparkles" size={20} color={a ? colors.gold : colors.mut} /> },
  Profile: { label: "Profile", render: (a) => <Feather name="user" size={20} color={a ? colors.gold : colors.mut} /> },
};

function TabItem({ routeName, focused, onPress }: { routeName: string; focused: boolean; onPress?: BottomTabBarButtonProps["onPress"] }) {
  const cfg = ICONS[routeName];
  return (
    <Pressable onPress={onPress} className="flex-1 items-center pt-[14px] gap-[5px]">
      <View
        className="w-[46px] h-[34px] rounded-[11px] items-center justify-center"
        style={focused ? { backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" } : undefined}
      >
        {cfg.render(focused)}
      </View>
      <Text className="font-mono text-[9px] tracking-[1px] uppercase" style={{ color: focused ? colors.gold : colors.mut }}>
        {cfg.label}
      </Text>
    </Pressable>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          height: 84,
          paddingBottom: 18,
          backgroundColor: "rgba(10,14,27,0.92)",
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
      }}
      tabBar={({ state, navigation }) => (
        <View className="absolute left-0 right-0 bottom-0 h-[84px] flex-row pb-[18px] px-3 border-t border-line" style={{ backgroundColor: "rgba(10,14,27,0.96)" }}>
          {state.routes.map((route, i) => (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={state.index === i}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (state.index !== i && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          ))}
        </View>
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen name="Resume" component={ResumeScreen} />
      <Tab.Screen name="Connect" component={ConnectScreen} />
      <Tab.Screen name="Advisor" component={AdvisorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
