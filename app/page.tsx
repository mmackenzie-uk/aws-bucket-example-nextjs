"use client"

import AWS from 'aws-sdk';
import { CommonPrefixList, ObjectList } from 'aws-sdk/clients/s3';
import { useState, useEffect } from 'react';

// Initialize the Amazon Cognito credentials provider
AWS.config.region = "eu-west-2"; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "---",
});
const Bucket = "---";
// Create a new service object
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket },
});

function ViewAlbum({ albumName } : { albumName: string}) {
    const [photos, setPhotos] = useState<ObjectList>([]);
    const [bucketUrl, setBucketUrl] = useState("");

    const prefix = encodeURIComponent(albumName) + "/";

    useEffect(() => {
      s3.listObjects({ Prefix: prefix, Bucket }, function(err, data){

         // @ts-ignore
        const href = this.request.httpRequest.endpoint.href;
        if (data.Contents) {
          setPhotos(data.Contents);
        }
        setBucketUrl(href + Bucket + "/");
      });
    }, [albumName]);

    const albumPhotosKey = encodeURIComponent(albumName) + "/"; 

    return (
      <>
        <h2>{`Album: ${albumName}`}</h2>
        {
          (photos.length === 0) ? 
              <p>The following photos are present.</p> 
            : <p>There are no photos in this album.</p>
        }
        <div>
        {
          photos.map(photo => (photo.Key === prefix) ?
            <span key={photo.Key}></span>
            :
            <span key={photo.Key}>
              <div>
                <br/>
                <img 
                  width={128} 
                  height={128} 
                  src={bucketUrl + encodeURIComponent(photo.Key!)} 
                />
              </div>
              <div>
                <span>
                  {photo.Key!.replace(albumPhotosKey, "")}
                </span>
              </div>
            </span>
          )
        }
        </div>
      </>
    )
}

function ListAlbums({ onClick } : { onClick: (albumName: string) => void}) {
    const [albums, setAlbums] = useState<CommonPrefixList>([]);

    useEffect(() => {
      s3.listObjects({ Delimiter: "/", Bucket }, (err, data) => {
        if (data.CommonPrefixes) {
          setAlbums(data.CommonPrefixes) 
        }
      });
    }, []);

    return (
      <>
        {
          (albums.length === 0) ? 
            <p>Click on an album name to view it.</p> 
          : <p>You do not have any albums. Please Create album.</p>
        }
        {
          albums.map((commonPrefix) => {
            var prefix = commonPrefix.Prefix;
            var albumName = decodeURIComponent(prefix!.replace("/", ""));
            return <li key={albumName} style={{margin: "5px"}}>
                    <button onClick={() => onClick(albumName)}>  
                      {albumName}
                    </button>
                  </li>
          })
        }
      </>
    )
}

export default function Home() {
  const [albumName, setAlbumName] = useState("album1");

  const handleAlbums = (albumName: string) => 
      setAlbumName(albumName);

  return (
    <div>
      <h1>Photo Album Viewer</h1>
      <h2>Albums</h2>
      <ListAlbums onClick={handleAlbums} />
      <ViewAlbum albumName={albumName} />
    </div>
  );
}
