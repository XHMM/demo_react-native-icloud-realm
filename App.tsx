import React, { useContext } from "react";
import { RealmContext, RealmVersionContext, RealmVersionProvider } from "./src/context";
import IndexScreen from "./src/index.screen";

const App = () => {
  return <RealmVersionProvider>
    <MyApp />
  </RealmVersionProvider>;
};

const MyApp = () => {
  const {version} = useContext(RealmVersionContext)
  return (
    <RealmContext.RealmProvider key={version}>
      <IndexScreen />
    </RealmContext.RealmProvider>

  );
};

export default App;
