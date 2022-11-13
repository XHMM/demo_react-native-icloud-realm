import { createRealmContext } from "@realm/react";
import { NoteSchema } from "./schema";
import { createContext, FC, PropsWithChildren, useState } from "react";

export const RealmContext = createRealmContext({
  schema: [NoteSchema],
  deleteRealmIfMigrationNeeded: true
})

export const RealmVersionContext = createContext<any>(null as any)
export const RealmVersionProvider: FC<PropsWithChildren> = ({children}) => {
  const [v, setV] = useState(0)
  return <RealmVersionContext.Provider value={{
    version: v,
    setVersion: setV
  }}>
    {children}
  </RealmVersionContext.Provider>
}
