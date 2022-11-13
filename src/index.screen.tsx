import { Button, View, Text, SafeAreaView, ActionSheetIOS, ScrollView } from "react-native";
import { NoteSchema } from "./schema";
import { RealmContext, RealmVersionContext } from "./context";
import * as CloudStore from "react-native-cloud-store";
import { Dirs, FileSystem } from "react-native-file-access";
import { useContext, useEffect, useState } from "react";

const IndexScreen = () => {
  const realm = RealmContext.useRealm()
  const notes = RealmContext.useQuery(NoteSchema)

  const createNote = () => {
    realm.write(() => {
      const note = new NoteSchema(realm,{
        content: 'sth',
      })
    })
  }

  const deleteNote = (note: NoteSchema) => {
    realm.write(() => {
      realm.delete(note)
    })
  }

  return <SafeAreaView style={{flex:1, backgroundColor: 'pink'}}>
      <Button title={"create"} onPress={createNote} />
      <View>
        {
          notes.map(note => {
            return <View key={note._id.toHexString()}>
              <Text>{note.content}</Text>
              <Text>{note.createdAt.toString()}</Text>
              <Button title={"delete"} onPress={deleteNote.bind(null, note)}/>
            </View>
          })
        }
      </View>
      <BackupArea />
  </SafeAreaView>
}

const BackupArea = () => {
  const realm = RealmContext.useRealm()
  const {setVersion} = useContext(RealmVersionContext)

  const [cloudFiles, setCloudFiles] = useState<string[]>([])

  // useEffect(() => {
  //   const r = CloudStore.onICloudDocumentsUpdateGathering((data) => {
  //     console.log('onICloudDocumentsUpdateGathering:', data);
  //   })
  // }, [])

  useEffect(() => {
    const uploadEvent = CloudStore.registerGlobalUploadEvent()
    const downloadEvent = CloudStore.registerGlobalDownloadEvent()
    return () => {
      uploadEvent?.remove()
      downloadEvent?.remove()
    }
  }, [])

  const backupWithProgress = async () => {
    const backupFileName = `backup_${Date.now()}.realm`
    const localPath = Dirs.DocumentDir +  `/${backupFileName}`
    realm.writeCopyTo({
      path: localPath
    })

    const cloudPath = CloudStore.PathUtils.join(CloudStore.defaultICloudContainerPath, backupFileName)
    // remove cloud before upload
    await CloudStore.unlink(cloudPath);
    await CloudStore.upload(localPath, cloudPath, {
      onProgress(data) {
        console.log('upload onProgress:', data);
      }
    })
  }

  const getCloudList = async () => {
    const paths = await CloudStore.readDir(CloudStore.defaultICloudContainerPath)
    setCloudFiles(paths)
    // you get detailed info using stat()
    for (const path of paths) {
      const info = await CloudStore.stat(path);
      // console.log('item detail:',info);
    }
  }

  const restoreFile = (path: string) => {
    ActionSheetIOS.showActionSheetWithOptions({
      options: ["Restore", "Delete", "Cancel"],
      cancelButtonIndex: 2,
      destructiveButtonIndex: 1,
    }, async (idx) => {
      // restore
      if(idx === 0) {
        await CloudStore.download(path, {
          async onProgress(data) {
            console.log('download onProgress:', data);
            if(data.progress === 100) {
              await FileSystem.unlink(realm.path)
              await FileSystem.cp(CloudStore.PathUtils.iCloudRemoveDotExt(path), realm.path)
              setVersion((v: any) => v+1)
            }
          }
        })
        return
      }

      // delete
      if(idx === 1) {
        await CloudStore.unlink(path)
        // after delete, we can re-read backup folder or just remove the path from array
        const paths = await CloudStore.readDir(CloudStore.defaultICloudContainerPath)
        setCloudFiles(paths)
        return
      }
    })
  }

  return <ScrollView>
    <Button title={"backup with progress"} onPress={backupWithProgress} />

    <Button title={"get cloud list"} onPress={getCloudList} />

    <View style={{borderWidth: 1, borderColor: 'black'}}>
      <Text style={{fontWeight:'bold'}}>cloud files:</Text>
      {cloudFiles.map(f => {
        return <Text key={f} style={{marginBottom: 5}} onPress={restoreFile.bind(null, f)}>{f}</Text>
      })}
    </View>
  </ScrollView>
}

export default IndexScreen
