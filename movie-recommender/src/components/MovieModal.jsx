import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, AspectRatio, Spinner, Text
} from '@chakra-ui/react';
import axios from 'axios';
import { TMDB_KEY, TMDB_API_BASE } from '../config';

export default function MovieModal({ isOpen, onClose, movieId, title }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    axios
      .get(`${TMDB_API_BASE}/movie/${movieId}`, {
        params: { api_key: TMDB_KEY, append_to_response: 'videos' }
      })
      .then(r => setData(r.data))
      .catch(() => setData({}));
  }, [movieId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!data ? (
            <Spinner />
          ) : (
            <>
              {data.videos?.results[0] && (
                <AspectRatio ratio={16/9} mb={4}>
                  <iframe
                    title="trailer"
                    src={`https://www.youtube.com/embed/${data.videos.results[0].key}`}
                    allowFullScreen
                  />
                </AspectRatio>
              )}
              <Text mb={4}>{data.overview}</Text>
              <Text fontWeight="bold">
                Компанії: {data.production_companies.map(c => c.name).join(', ')}
              </Text>
              <Text>Реліз: {data.release_date}</Text>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
